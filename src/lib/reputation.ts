import { prisma } from '@/lib/prisma'
import { isCreatorFullySetUp } from '@/lib/creator-eligibility'

export type ReputationTier = 'sanctioned' | 'restricted' | 'neutral' | 'trusted' | 'verified'

export const TIER_THRESHOLDS: Record<ReputationTier, { min: number; max: number }> = {
  sanctioned: { min: -Infinity, max: -30 },
  restricted: { min: -29,      max: -10 },
  neutral:    { min: -9,       max: 9   },
  trusted:    { min: 10,       max: 29  },
  verified:   { min: 30,       max: Infinity },
}

/** Minimum days between payment confirmation and campaign start date, per tier. */
export const TIER_COOLDOWN_DAYS: Record<ReputationTier, number | null> = {
  sanctioned: null, // blocked — requires admin approval to launch
  restricted: 14,
  neutral:    7,
  trusted:    3,
  verified:   0,
}

export const TIER_LABELS: Record<ReputationTier, string> = {
  sanctioned: 'Sanctioned',
  restricted: 'Restricted',
  neutral:    'Neutral',
  trusted:    'Trusted',
  verified:   'Verified',
}

export const TIER_DESCRIPTIONS: Record<ReputationTier, string> = {
  sanctioned: 'Your account requires admin approval before any campaign can launch.',
  restricted: 'Your campaign start date must be at least 14 days after payment confirmation.',
  neutral:    'Your campaign start date must be at least 7 days after payment confirmation.',
  trusted:    'Your campaign start date must be at least 3 days after payment confirmation.',
  verified:   'No minimum gap required between payment and campaign start date.',
}

export function tierFromScore(score: number): ReputationTier {
  if (score <= -30) return 'sanctioned'
  if (score <= -10) return 'restricted'
  if (score <= 9)   return 'neutral'
  if (score <= 29)  return 'trusted'
  return 'verified'
}

export const OPT_OUT_SCORE_DELTAS = {
  valid:   0,
  invalid: -10,
} as const

export const COMPLETION_BONUS = 5
/** Awarded to a referrer once a creator they referred fully sets up their own account. */
export const REFERRAL_BONUS = 10
/** Awarded to a sponsor once every accepted creator on a campaign has been paid out. */
export const SPONSOR_FULL_PAYOUT_BONUS = 3
export const LATE_PENALTY_PER_DAY = 1
export const LATE_PENALTY_CAP = 10

/** Score deltas keyed by (verdict, hadAcceptedApplications). */
export const REFUND_SCORE_DELTAS = {
  valid_no_accepted:    0,
  valid_had_accepted:   -5,
  invalid_no_accepted:  -10,
  invalid_had_accepted: -15,
} as const

export function proofDeadline(endDate: Date): Date {
  const d = new Date(endDate)
  d.setDate(d.getDate() + 7)
  return d
}

/**
 * Cumulative late-proof penalty owed for a submission `daysLate` past its deadline:
 * `LATE_PENALTY_PER_DAY` per day, floored at `LATE_PENALTY_CAP`. Pure — the daily
 * cron uses it both to persist `late_penalty_applied` and (via `proof_late`) to derive
 * the incremental reputation delta, so the accrual formula lives in exactly one place.
 */
export function latePenaltyOwed(daysLate: number): number {
  return Math.min(daysLate * LATE_PENALTY_PER_DAY, LATE_PENALTY_CAP)
}

// ── Reputation events ────────────────────────────────────────────────────────
//
// Reputation only moves for a handful of named domain events. Callers name the
// event that happened; this module owns *how much* it's worth (`reputationDelta`),
// *who* it lands on, and the atomic apply (`recordReputationEvent`). No caller
// re-encodes a delta table or writes `reputation_score` directly — the raw-delta
// escape hatch is gone, so the encoding can't drift across call sites (it used to
// be duplicated byte-for-byte across the two refund-verdict handlers).

/** A reputation-moving domain event, carrying the subject it lands on. */
export type ReputationEvent =
  // creator events
  | { type: 'deal_completed'; creatorId: string }
  | { type: 'opt_out_ruled'; creatorId: string; verdict: 'valid' | 'invalid' }
  | { type: 'leveled_up'; creatorId: string; levelsGained: number }
  | { type: 'proof_late'; creatorId: string; daysLate: number; alreadyPenalized: number }
  | { type: 'referral_converted'; creatorId: string }
  // sponsor events
  | { type: 'refund_ruled'; sponsorId: string; verdict: 'valid' | 'invalid'; hadAcceptedApplications: boolean }
  | { type: 'campaign_fully_paid'; sponsorId: string }

/**
 * The signed score change an event is worth. Pure and total over the union — the one
 * source of truth for the reputation encoding. `0` means "recorded, no movement".
 */
export function reputationDelta(event: ReputationEvent): number {
  switch (event.type) {
    case 'deal_completed':
      return COMPLETION_BONUS
    case 'campaign_fully_paid':
      return SPONSOR_FULL_PAYOUT_BONUS
    case 'opt_out_ruled':
      return OPT_OUT_SCORE_DELTAS[event.verdict]
    case 'leveled_up':
      return event.levelsGained // +1 reputation per level gained
    case 'refund_ruled': {
      const key =
        `${event.verdict}_${event.hadAcceptedApplications ? 'had_accepted' : 'no_accepted'}` as keyof typeof REFUND_SCORE_DELTAS
      return REFUND_SCORE_DELTAS[key]
    }
    case 'proof_late':
      return -(latePenaltyOwed(event.daysLate) - event.alreadyPenalized)
    case 'referral_converted':
      return REFERRAL_BONUS
  }
}

/** The subject table + id an event lands on. */
function eventSubject(event: ReputationEvent): { table: 'creator' | 'sponsor'; id: string } {
  switch (event.type) {
    case 'deal_completed':
    case 'opt_out_ruled':
    case 'leveled_up':
    case 'proof_late':
    case 'referral_converted':
      return { table: 'creator', id: event.creatorId }
    case 'refund_ruled':
    case 'campaign_fully_paid':
      return { table: 'sponsor', id: event.sponsorId }
  }
}

/** Outcome of recording an event: what was applied and the resulting standing. */
export interface ReputationChange {
  /** The signed delta applied. `0` when the event carries no score movement. */
  delta: number
  /** Subject's score after applying — present only when `delta !== 0`. */
  score?: number
  tier?: ReputationTier
}

/**
 * Records a reputation event: computes its delta, applies it atomically to the subject,
 * and recomputes the tier. Returns the applied delta + resulting standing so callers can
 * craft their own messaging, or `null` if the subject row no longer exists.
 *
 * The score is moved with an atomic `increment` (not a read-modify-write), so two
 * concurrent events on the same subject can't lose each other's delta — the score is
 * always exact. The derived tier can lag by one event under rare true concurrency but
 * self-heals on the next event.
 *
 * This is the single choke point for every reputation change — the natural home for the
 * append-only audit ledger tracked in issue #7 (one insert here, zero caller changes).
 */
export async function recordReputationEvent(event: ReputationEvent): Promise<ReputationChange | null> {
  const delta = reputationDelta(event)
  if (delta === 0) return { delta: 0 } // recorded; nothing to persist

  const { table, id } = eventSubject(event)
  const score = table === 'creator' ? await applyCreatorDelta(id, delta) : await applySponsorDelta(id, delta)
  if (score === null) return null

  return { delta, score, tier: tierFromScore(score) }
}

async function applyCreatorDelta(id: string, delta: number): Promise<number | null> {
  const res = await prisma.content_creators.updateMany({
    where: { id },
    data: { reputation_score: { increment: delta } },
  })
  if (res.count === 0) return null

  const row = await prisma.content_creators.findUnique({ where: { id }, select: { reputation_score: true } })
  if (!row) return null

  await prisma.content_creators.update({ where: { id }, data: { reputation_tier: tierFromScore(row.reputation_score) } })
  return row.reputation_score
}

async function applySponsorDelta(id: string, delta: number): Promise<number | null> {
  const res = await prisma.sponsors.updateMany({
    where: { id },
    data: { reputation_score: { increment: delta } },
  })
  if (res.count === 0) return null

  const row = await prisma.sponsors.findUnique({ where: { id }, select: { reputation_score: true } })
  if (!row) return null

  await prisma.sponsors.update({ where: { id }, data: { reputation_tier: tierFromScore(row.reputation_score) } })
  return row.reputation_score
}

/**
 * Returns the earliest allowed start date for a campaign given the sponsor's tier
 * and when payment was confirmed.
 * Returns null if the tier requires admin approval (sanctioned).
 */
export function earliestStartDate(tier: ReputationTier, paymentConfirmedAt: Date): Date | null {
  const cooldown = TIER_COOLDOWN_DAYS[tier]
  if (cooldown === null) return null
  const d = new Date(paymentConfirmedAt)
  d.setDate(d.getDate() + cooldown)
  return d
}

/**
 * Checks whether a referred creator has just crossed the "fully set up" bar and,
 * if so, grants their referrer the one-time referral reputation bonus.
 *
 * Safe to call repeatedly (e.g. on every dashboard load) — the `reward_granted_at
 * IS NULL` claim in the update is atomic, so concurrent calls can't double-grant.
 */
export async function maybeGrantReferralReward(creatorId: string): Promise<void> {
  const referral = await prisma.creator_referrals.findFirst({
    where: { referred_id: creatorId, reward_granted_at: null },
    select: { id: true, referrer_id: true },
  })
  if (!referral) return

  const creator = await prisma.content_creators.findUnique({
    where: { id: creatorId },
    select: { platform: true, twitch_username: true, youtube_channel_name: true, stripe_onboarding_complete: true },
  })
  if (!creator || !isCreatorFullySetUp(creator)) return

  const claimed = await prisma.creator_referrals.updateMany({
    where: { id: referral.id, reward_granted_at: null },
    data: { reward_granted_at: new Date() },
  })
  if (claimed.count !== 1) return // another concurrent call already claimed it

  await recordReputationEvent({ type: 'referral_converted', creatorId: referral.referrer_id })
}
