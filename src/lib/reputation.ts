import { prisma } from '@/lib/prisma'

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
export const LATE_PENALTY_PER_DAY = 1
export const LATE_PENALTY_CAP = 10

export function proofDeadline(endDate: Date): Date {
  const d = new Date(endDate)
  d.setDate(d.getDate() + 7)
  return d
}

export async function adjustCreatorReputation(creatorId: string, delta: number) {
  const creator = await prisma.content_creators.findUnique({
    where: { id: creatorId },
    select: { reputation_score: true },
  })
  if (!creator) return

  const newScore = creator.reputation_score + delta
  const newTier = tierFromScore(newScore)

  await prisma.content_creators.update({
    where: { id: creatorId },
    data: { reputation_score: newScore, reputation_tier: newTier },
  })
}

/** Score deltas keyed by (verdict, hadAcceptedApplications). */
export const REFUND_SCORE_DELTAS = {
  valid_no_accepted:    0,
  valid_had_accepted:   -5,
  invalid_no_accepted:  -10,
  invalid_had_accepted: -15,
} as const

/** Applies a score delta to a sponsor, recalculates tier, and persists both. */
export async function adjustSponsorReputation(sponsorId: string, delta: number) {
  const sponsor = await prisma.sponsors.findUnique({
    where: { id: sponsorId },
    select: { reputation_score: true },
  })
  if (!sponsor) return

  const newScore = sponsor.reputation_score + delta
  const newTier = tierFromScore(newScore)

  await prisma.sponsors.update({
    where: { id: sponsorId },
    data: { reputation_score: newScore, reputation_tier: newTier },
  })
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
