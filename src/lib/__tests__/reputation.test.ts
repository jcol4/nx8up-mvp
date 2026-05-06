import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  tierFromScore,
  earliestStartDate,
  adjustSponsorReputation,
  adjustCreatorReputation,
  REFUND_SCORE_DELTAS,
  OPT_OUT_SCORE_DELTAS,
  COMPLETION_BONUS,
  proofDeadline,
} from '../reputation'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    sponsors: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    content_creators: {
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

// ── adjustSponsorReputation ──────────────────────────────────────────────────

describe('adjustSponsorReputation', () => {
  beforeEach(() => {
    vi.mocked(prisma.sponsors.update).mockResolvedValue({} as any)
  })

  it('applies negative delta and recalculates tier', async () => {
    vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ reputation_score: 0 } as any)
    await adjustSponsorReputation('sponsor-1', -10)
    expect(prisma.sponsors.update).toHaveBeenCalledWith({
      where: { id: 'sponsor-1' },
      data: { reputation_score: -10, reputation_tier: 'restricted' },
    })
  })

  it('applies positive delta and upgrades tier', async () => {
    vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ reputation_score: 27 } as any)
    await adjustSponsorReputation('sponsor-1', 3)
    expect(prisma.sponsors.update).toHaveBeenCalledWith({
      where: { id: 'sponsor-1' },
      data: { reputation_score: 30, reputation_tier: 'verified' },
    })
  })

  it('does nothing if sponsor not found', async () => {
    vi.mocked(prisma.sponsors.findUnique).mockResolvedValue(null)
    await adjustSponsorReputation('missing', -5)
    expect(prisma.sponsors.update).not.toHaveBeenCalled()
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

// ── adjustCreatorReputation ──────────────────────────────────────────────────

describe('adjustCreatorReputation', () => {
  beforeEach(() => {
    vi.mocked(prisma.content_creators.update).mockResolvedValue({} as any)
  })

  it('applies negative delta and recalculates tier', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ reputation_score: 0 } as any)
    await adjustCreatorReputation('creator-1', -10)
    expect(prisma.content_creators.update).toHaveBeenCalledWith({
      where: { id: 'creator-1' },
      data: { reputation_score: -10, reputation_tier: 'restricted' },
    })
  })

  it('applies positive delta and upgrades tier', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ reputation_score: 27 } as any)
    await adjustCreatorReputation('creator-1', 3)
    expect(prisma.content_creators.update).toHaveBeenCalledWith({
      where: { id: 'creator-1' },
      data: { reputation_score: 30, reputation_tier: 'verified' },
    })
  })

  it('does nothing if creator not found', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(null)
    await adjustCreatorReputation('missing', 5)
    expect(prisma.content_creators.update).not.toHaveBeenCalled()
  })
})
