import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  tierFromScore,
  earliestStartDate,
  recordReputationEvent,
  reputationDelta,
  latePenaltyOwed,
  REFUND_SCORE_DELTAS,
  OPT_OUT_SCORE_DELTAS,
  COMPLETION_BONUS,
  SPONSOR_FULL_PAYOUT_BONUS,
  proofDeadline,
} from '../reputation'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    sponsors: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    content_creators: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

// ── tierFromScore ────────────────────────────────────────────────────────────

describe('tierFromScore', () => {
  it('returns sanctioned at boundary -30', () => {
    expect(tierFromScore(-30)).toBe('sanctioned')
  })
  it('returns sanctioned below -30', () => {
    expect(tierFromScore(-31)).toBe('sanctioned')
  })
  it('returns restricted at -29', () => {
    expect(tierFromScore(-29)).toBe('restricted')
  })
  it('returns restricted at -10', () => {
    expect(tierFromScore(-10)).toBe('restricted')
  })
  it('returns neutral at -9', () => {
    expect(tierFromScore(-9)).toBe('neutral')
  })
  it('returns neutral at 0', () => {
    expect(tierFromScore(0)).toBe('neutral')
  })
  it('returns neutral at 9', () => {
    expect(tierFromScore(9)).toBe('neutral')
  })
  it('returns trusted at 10', () => {
    expect(tierFromScore(10)).toBe('trusted')
  })
  it('returns trusted at 29', () => {
    expect(tierFromScore(29)).toBe('trusted')
  })
  it('returns verified at 30', () => {
    expect(tierFromScore(30)).toBe('verified')
  })
  it('returns verified above 30', () => {
    expect(tierFromScore(100)).toBe('verified')
  })
})

// ── earliestStartDate ────────────────────────────────────────────────────────

describe('earliestStartDate', () => {
  const base = new Date('2026-06-15T12:00:00Z') // midday UTC — avoids day-boundary issues in any timezone
  const MS_PER_DAY = 86_400_000

  it('returns null for sanctioned', () => {
    expect(earliestStartDate('sanctioned', base)).toBeNull()
  })

  it('adds 14 days for restricted', () => {
    const result = earliestStartDate('restricted', base)
    expect(result).not.toBeNull()
    expect(result!.getTime() - base.getTime()).toBe(14 * MS_PER_DAY)
  })

  it('adds 7 days for neutral', () => {
    const result = earliestStartDate('neutral', base)
    expect(result).not.toBeNull()
    expect(result!.getTime() - base.getTime()).toBe(7 * MS_PER_DAY)
  })

  it('adds 3 days for trusted', () => {
    const result = earliestStartDate('trusted', base)
    expect(result).not.toBeNull()
    expect(result!.getTime() - base.getTime()).toBe(3 * MS_PER_DAY)
  })

  it('adds 0 days for verified (same date)', () => {
    const result = earliestStartDate('verified', base)
    expect(result).not.toBeNull()
    expect(result!.getTime()).toBe(base.getTime())
  })
})

// ── reputationDelta (pure: the single source of the encoding) ─────────────────

describe('reputationDelta', () => {
  it('deal_completed = COMPLETION_BONUS', () => {
    expect(reputationDelta({ type: 'deal_completed', creatorId: 'c' })).toBe(COMPLETION_BONUS)
  })
  it('campaign_fully_paid = SPONSOR_FULL_PAYOUT_BONUS', () => {
    expect(reputationDelta({ type: 'campaign_fully_paid', sponsorId: 's' })).toBe(SPONSOR_FULL_PAYOUT_BONUS)
  })
  it('opt_out_ruled valid = 0, invalid = -10', () => {
    expect(reputationDelta({ type: 'opt_out_ruled', creatorId: 'c', verdict: 'valid' })).toBe(0)
    expect(reputationDelta({ type: 'opt_out_ruled', creatorId: 'c', verdict: 'invalid' })).toBe(-10)
  })
  it('leveled_up = levels gained', () => {
    expect(reputationDelta({ type: 'leveled_up', creatorId: 'c', levelsGained: 2 })).toBe(2)
  })
  it('refund_ruled spans the full (verdict × hadAccepted) table', () => {
    expect(reputationDelta({ type: 'refund_ruled', sponsorId: 's', verdict: 'valid', hadAcceptedApplications: false })).toBe(0)
    expect(reputationDelta({ type: 'refund_ruled', sponsorId: 's', verdict: 'valid', hadAcceptedApplications: true })).toBe(-5)
    expect(reputationDelta({ type: 'refund_ruled', sponsorId: 's', verdict: 'invalid', hadAcceptedApplications: false })).toBe(-10)
    expect(reputationDelta({ type: 'refund_ruled', sponsorId: 's', verdict: 'invalid', hadAcceptedApplications: true })).toBe(-15)
  })
  it('proof_late charges only the incremental days since last run', () => {
    expect(reputationDelta({ type: 'proof_late', creatorId: 'c', daysLate: 3, alreadyPenalized: 0 })).toBe(-3)
    expect(reputationDelta({ type: 'proof_late', creatorId: 'c', daysLate: 5, alreadyPenalized: 2 })).toBe(-3)
  })
  it('proof_late never charges past the cap', () => {
    // 23 days owed clamps to 10; 8 already applied → only -2 more.
    expect(reputationDelta({ type: 'proof_late', creatorId: 'c', daysLate: 23, alreadyPenalized: 8 })).toBe(-2)
  })
})

// ── latePenaltyOwed (pure accrual formula) ───────────────────────────────────

describe('latePenaltyOwed', () => {
  it('is 1 per day', () => {
    expect(latePenaltyOwed(3)).toBe(3)
  })
  it('floors at the cap of 10', () => {
    expect(latePenaltyOwed(50)).toBe(10)
  })
})

// ── REFUND_SCORE_DELTAS ──────────────────────────────────────────────────────

describe('REFUND_SCORE_DELTAS', () => {
  it('valid_no_accepted = 0', () => {
    expect(REFUND_SCORE_DELTAS.valid_no_accepted).toBe(0)
  })
  it('valid_had_accepted = -5', () => {
    expect(REFUND_SCORE_DELTAS.valid_had_accepted).toBe(-5)
  })
  it('invalid_no_accepted = -10', () => {
    expect(REFUND_SCORE_DELTAS.invalid_no_accepted).toBe(-10)
  })
  it('invalid_had_accepted = -15', () => {
    expect(REFUND_SCORE_DELTAS.invalid_had_accepted).toBe(-15)
  })
})

// ── proofDeadline ────────────────────────────────────────────────────────────

describe('proofDeadline', () => {
  const MS_PER_DAY = 86_400_000
  const base = new Date('2026-06-15T12:00:00Z')

  it('returns end_date + 7 days', () => {
    const result = proofDeadline(base)
    expect(result.getTime() - base.getTime()).toBe(7 * MS_PER_DAY)
  })

  it('does not mutate the input date', () => {
    const original = base.getTime()
    proofDeadline(base)
    expect(base.getTime()).toBe(original)
  })
})

// ── OPT_OUT_SCORE_DELTAS ─────────────────────────────────────────────────────

describe('OPT_OUT_SCORE_DELTAS', () => {
  it('valid = 0', () => {
    expect(OPT_OUT_SCORE_DELTAS.valid).toBe(0)
  })
  it('invalid = -10', () => {
    expect(OPT_OUT_SCORE_DELTAS.invalid).toBe(-10)
  })
})

// ── COMPLETION_BONUS ─────────────────────────────────────────────────────────

describe('COMPLETION_BONUS', () => {
  it('equals 5', () => {
    expect(COMPLETION_BONUS).toBe(5)
  })
})

// ── recordReputationEvent (applies the event atomically) ─────────────────────

describe('recordReputationEvent', () => {
  beforeEach(() => {
    vi.mocked(prisma.content_creators.updateMany).mockResolvedValue({ count: 1 } as any)
    vi.mocked(prisma.content_creators.update).mockResolvedValue({} as any)
    vi.mocked(prisma.sponsors.updateMany).mockResolvedValue({ count: 1 } as any)
    vi.mocked(prisma.sponsors.update).mockResolvedValue({} as any)
  })

  it('moves the creator score with an atomic increment (not a read-modify-write)', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ reputation_score: 12 } as any)
    const change = await recordReputationEvent({ type: 'deal_completed', creatorId: 'creator-1' })
    expect(prisma.content_creators.updateMany).toHaveBeenCalledWith({
      where: { id: 'creator-1' },
      data: { reputation_score: { increment: 5 } },
    })
    expect(prisma.content_creators.update).toHaveBeenCalledWith({
      where: { id: 'creator-1' },
      data: { reputation_tier: 'trusted' }, // post-increment score 12 → trusted
    })
    expect(change).toEqual({ delta: 5, score: 12, tier: 'trusted' })
  })

  it('routes sponsor events to the sponsor table and recomputes tier', async () => {
    vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ reputation_score: -15 } as any)
    const change = await recordReputationEvent({
      type: 'refund_ruled', sponsorId: 'sponsor-1', verdict: 'invalid', hadAcceptedApplications: true,
    })
    expect(prisma.sponsors.updateMany).toHaveBeenCalledWith({
      where: { id: 'sponsor-1' },
      data: { reputation_score: { increment: -15 } },
    })
    expect(change).toEqual({ delta: -15, score: -15, tier: 'restricted' })
  })

  it('records a zero-delta event without touching the database', async () => {
    const change = await recordReputationEvent({ type: 'opt_out_ruled', creatorId: 'creator-1', verdict: 'valid' })
    expect(change).toEqual({ delta: 0 })
    expect(prisma.content_creators.updateMany).not.toHaveBeenCalled()
    expect(prisma.content_creators.update).not.toHaveBeenCalled()
  })

  it('returns null and writes no tier when the subject row is gone', async () => {
    vi.mocked(prisma.content_creators.updateMany).mockResolvedValue({ count: 0 } as any)
    const change = await recordReputationEvent({ type: 'deal_completed', creatorId: 'missing' })
    expect(change).toBeNull()
    expect(prisma.content_creators.update).not.toHaveBeenCalled()
  })
})
