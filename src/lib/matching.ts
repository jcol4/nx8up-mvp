/**
 * Matching engine — scores a creator against a campaign's full specification.
 *
 * Hard blocks (eligible = false):
 *   - Creator is not available
 *   - Platform: campaign specifies platforms and creator has zero overlap
 *   - Numeric minimums (followers, avg viewers, engagement): creator is more than
 *     25% below the requirement (i.e. < 75% of required value)
 *
 * Soft criteria (contribute to score, never block):
 *   - Creator types, sizes, game categories, content types
 *   - Audience locations, age range, gender
 *   - Interest overlap (fuzzy + synonym-aware)
 *   - Campaign type / product type preference alignment
 *
 * Tag matching uses normalization (case/punctuation-insensitive) and a synonym
 * dictionary so that related tags like "FPS", "Shooter", and "Valorant" connect.
 */

import { SYNONYMS } from './tag-synonyms'

export type CampaignCriteria = {
  platform: string[]
  min_subs_followers: number | null
  min_avg_viewers: number | null
  min_engagement_rate: { toNumber(): number } | number | null
  min_audience_age: number | null
  max_audience_age: number | null
  required_audience_locations: string[]
  target_genders: string[]
  target_interests: string[]
  creator_types: string[]
  creator_sizes: string[]
  game_category: string[]
  content_type: string[]
  campaign_type: string | null
  product_type: string | null
}

export type CreatorForMatching = {
  platform: string[]
  subs_followers: number | null
  youtube_subscribers: number | null
  average_vod_views: number | null
  youtube_avg_views: number | null
  engagement_rate: { toNumber(): number } | number | null
  audience_age_min: number | null
  audience_age_max: number | null
  audience_locations: string[]
  audience_gender: string[]
  audience_interests: string[]
  creator_types: string[]
  creator_size: string | null
  game_category: string[]
  content_type: string[]
  preferred_campaign_types: string[]
  preferred_product_types: string[]
  is_available: boolean
}

export type MatchResult = {
  eligible: boolean
  score: number      // 0–100
  reasons: string[]  // hard failures surfaced to the creator
  notes: string[]    // soft mismatches (informational)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: { toNumber(): number } | number | null): number | null {
  if (v == null) return null
  return typeof v === 'object' ? v.toNumber() : v
}

const TOLERANCE = 0.67 // creator must be >= 67% of requirement

/**
 * Normalize a tag: lowercase, strip apostrophes/backticks, collapse all
 * remaining non-alphanumeric characters into single spaces.
 * "CS:GO" → "cs go"  |  "Baldur's Gate 3" → "baldurs gate 3"
 */
function normTag(s: string): string {
  return s
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Returns true if two tags are semantically equivalent via:
 *   1. Exact match after normalization
 *   2. b's normalized form appears in a's synonym list
 *   3. a's normalized form appears in b's synonym list
 */
function tagsMatch(a: string, b: string): boolean {
  const na = normTag(a)
  const nb = normTag(b)
  if (na === nb) return true
  return (SYNONYMS[na] ?? []).includes(nb) || (SYNONYMS[nb] ?? []).includes(na)
}

/**
 * Proportion of `required` tags that semantically match at least one
 * tag in `available`, using normalization + synonym expansion.
 */
function overlapRatio(required: string[], available: string[]): number {
  if (required.length === 0 || available.length === 0) return 0
  const matched = required.filter(r => available.some(a => tagsMatch(r, a)))
  return matched.length / required.length
}

/**
 * Interest overlap: a campaign interest matches if any creator interest
 * is an exact/synonym match OR contains it as a substring (case-insensitive).
 */
function interestOverlapRatio(campaignInterests: string[], creatorInterests: string[]): number {
  if (campaignInterests.length === 0 || creatorInterests.length === 0) return 0
  const matched = campaignInterests.filter(ci => {
    const cn = normTag(ci)
    return creatorInterests.some(c => {
      const cc = normTag(c)
      if (cc.includes(cn) || cn.includes(cc)) return true
      return (SYNONYMS[cn] ?? []).includes(cc) || (SYNONYMS[cc] ?? []).includes(cn)
    })
  })
  return matched.length / campaignInterests.length
}

/** Age-range overlap proportion: how much of the campaign's range the creator covers. */
function ageOverlapRatio(
  cMin: number, cMax: number,
  rMin: number, rMax: number,
): number {
  const overlapMin = Math.max(cMin, rMin)
  const overlapMax = Math.min(cMax, rMax)
  if (overlapMax < overlapMin) return 0
  const campaignSpan = cMax - cMin || 1
  return (overlapMax - overlapMin) / campaignSpan
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function matchCreatorToCampaign(
  creator: CreatorForMatching,
  campaign: CampaignCriteria,
): MatchResult {
  const reasons: string[] = []
  const notes: string[] = []

  // Accumulate weighted scores only for criteria the campaign actually specifies.
  let totalWeight = 0
  let earnedScore = 0

  function addScore(weight: number, ratio: number) {
    totalWeight += weight
    earnedScore += weight * ratio
  }

  // ── Availability (hard) ───────────────────────────────────────────────────
  if (!creator.is_available) {
    reasons.push('Your profile is currently set to unavailable.')
  }

  // ── Platform (soft) ───────────────────────────────────────────────────────
  if (campaign.platform.length > 0 && creator.platform.length > 0) {
    const ratio = overlapRatio(campaign.platform, creator.platform)
    addScore(20, ratio)
    if (ratio === 0) {
      notes.push(
        `Platform: campaign targets ${campaign.platform.join(' / ')} — your profile shows ${creator.platform.join(', ')}`,
      )
    }
  }

  // ── Min followers (25% tolerance) ────────────────────────────────────────
  if (campaign.min_subs_followers != null) {
    const best = Math.max(creator.subs_followers ?? 0, creator.youtube_subscribers ?? 0)
    const hasData = creator.subs_followers != null || creator.youtube_subscribers != null
    if (hasData) {
      addScore(15, Math.min(1, best / campaign.min_subs_followers))
      if (best < campaign.min_subs_followers * TOLERANCE) {
        reasons.push(
          `Min ${campaign.min_subs_followers.toLocaleString()} followers required — you have ${best.toLocaleString()}`,
        )
      } else if (best < campaign.min_subs_followers) {
        notes.push(
          `Followers slightly below requirement (${best.toLocaleString()} / ${campaign.min_subs_followers.toLocaleString()}) — within tolerance`,
        )
      }
    }
  }

  // ── Min avg viewers (25% tolerance) ──────────────────────────────────────
  if (campaign.min_avg_viewers != null) {
    const best = Math.max(creator.average_vod_views ?? 0, creator.youtube_avg_views ?? 0)
    const hasData = creator.average_vod_views != null || creator.youtube_avg_views != null
    if (hasData) {
      addScore(15, Math.min(1, best / campaign.min_avg_viewers))
      if (best < campaign.min_avg_viewers * TOLERANCE) {
        reasons.push(
          `Min ${campaign.min_avg_viewers.toLocaleString()} avg viewers required — you have ${best.toLocaleString()}`,
        )
      } else if (best < campaign.min_avg_viewers) {
        notes.push(
          `Avg viewers slightly below requirement (${best.toLocaleString()} / ${campaign.min_avg_viewers.toLocaleString()}) — within tolerance`,
        )
      }
    }
  }

  // ── Min engagement rate (25% tolerance) ──────────────────────────────────
  const reqRate = toNum(campaign.min_engagement_rate)
  const creatorRate = toNum(creator.engagement_rate)
  if (reqRate != null && creatorRate != null) {
    addScore(10, Math.min(1, creatorRate / reqRate))
    if (creatorRate < reqRate * TOLERANCE) {
      reasons.push(
        `Min ${reqRate.toFixed(1)}% engagement required — you have ${creatorRate.toFixed(2)}%`,
      )
    } else if (creatorRate < reqRate) {
      notes.push(
        `Engagement slightly below requirement (${creatorRate.toFixed(2)}% / ${reqRate.toFixed(1)}%) — within tolerance`,
      )
    }
  }

  // ── Creator types (soft) ──────────────────────────────────────────────────
  if (campaign.creator_types.length > 0 && creator.creator_types.length > 0) {
    const ratio = overlapRatio(campaign.creator_types, creator.creator_types)
    addScore(8, ratio)
    if (ratio === 0) {
      notes.push(`Creator type: campaign prefers ${campaign.creator_types.join(', ')}`)
    }
  }

  // ── Creator size (soft) ───────────────────────────────────────────────────
  if (campaign.creator_sizes.length > 0 && creator.creator_size != null) {
    const matches = campaign.creator_sizes.includes(creator.creator_size)
    addScore(7, matches ? 1 : 0)
    if (!matches) {
      notes.push(
        `Creator size: campaign targets ${campaign.creator_sizes.join(', ')} — you are ${creator.creator_size}`,
      )
    }
  }

  // ── Game categories (soft) ────────────────────────────────────────────────
  if (campaign.game_category.length > 0 && creator.game_category.length > 0) {
    const ratio = overlapRatio(campaign.game_category, creator.game_category)
    addScore(7, ratio)
    if (ratio === 0) {
      notes.push(`Game categories: no overlap with campaign (${campaign.game_category.join(', ')})`)
    }
  }

  // ── Content types (soft) ─────────────────────────────────────────────────
  if (campaign.content_type.length > 0 && creator.content_type.length > 0) {
    const ratio = overlapRatio(campaign.content_type, creator.content_type)
    addScore(5, ratio)
    if (ratio === 0) {
      notes.push(`Content type: no overlap with campaign requirements`)
    }
  }

  // ── Audience locations (soft) ─────────────────────────────────────────────
  if (campaign.required_audience_locations.length > 0 && creator.audience_locations.length > 0) {
    const ratio = overlapRatio(campaign.required_audience_locations, creator.audience_locations)
    addScore(5, ratio)
    if (ratio === 0) {
      notes.push(
        `Audience locations: campaign targets ${campaign.required_audience_locations.join(', ')}`,
      )
    }
  }

  // ── Audience age range (soft) ─────────────────────────────────────────────
  if (
    (campaign.min_audience_age != null || campaign.max_audience_age != null) &&
    creator.audience_age_min != null &&
    creator.audience_age_max != null
  ) {
    const cMin = campaign.min_audience_age ?? 0
    const cMax = campaign.max_audience_age ?? 100
    const ratio = ageOverlapRatio(cMin, cMax, creator.audience_age_min, creator.audience_age_max)
    addScore(4, ratio)
    if (ratio === 0) {
      notes.push(
        `Audience age: campaign targets ${cMin}–${cMax}, your audience is ${creator.audience_age_min}–${creator.audience_age_max}`,
      )
    }
  }

  // ── Audience gender (soft) ────────────────────────────────────────────────
  if (campaign.target_genders.length > 0 && creator.audience_gender.length > 0) {
    // 'All' in campaign or creator means any gender is acceptable
    const campaignAll = campaign.target_genders.some(g => g.toLowerCase() === 'all')
    const creatorAll = creator.audience_gender.some(g => g.toLowerCase() === 'all')
    let ratio: number
    if (campaignAll || creatorAll) {
      ratio = 1
    } else {
      ratio = overlapRatio(campaign.target_genders, creator.audience_gender)
    }
    addScore(3, ratio)
    if (ratio === 0) {
      notes.push(
        `Audience gender: campaign targets ${campaign.target_genders.join(', ')} — your audience is ${creator.audience_gender.join(', ')}`,
      )
    }
  }

  // ── Target interests vs audience interests (soft, fuzzy) ─────────────────
  if (campaign.target_interests.length > 0 && creator.audience_interests.length > 0) {
    const ratio = interestOverlapRatio(campaign.target_interests, creator.audience_interests)
    addScore(4, ratio)
    if (ratio === 0) {
      notes.push(`Audience interests: no overlap with campaign target interests`)
    }
  }

  // ── Campaign type preference (soft) ───────────────────────────────────────
  if (campaign.campaign_type && creator.preferred_campaign_types.length > 0) {
    const matches = creator.preferred_campaign_types.includes(campaign.campaign_type)
    addScore(3, matches ? 1 : 0.5) // 0.5 = no preference set against it, just not preferred
    if (!matches) {
      notes.push(`Campaign type (${campaign.campaign_type}) is not in your preferred mission types`)
    }
  }

  // ── Product type preference (soft) ────────────────────────────────────────
  if (campaign.product_type && creator.preferred_product_types.length > 0) {
    const matches = creator.preferred_product_types.includes(campaign.product_type)
    addScore(3, matches ? 1 : 0.5)
    if (!matches) {
      notes.push(`Product type (${campaign.product_type}) is not in your preferred product types`)
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedScore / totalWeight) * 100) : 100
  const eligible = reasons.length === 0

  return { eligible, score, reasons, notes }
}

/** Derive a creator size bucket from combined follower counts. */
export function computeCreatorSize(
  twitchFollowers: number | null,
  youtubeSubscribers: number | null,
): string | null {
  const total = (twitchFollowers ?? 0) + (youtubeSubscribers ?? 0)
  if (total === 0) return null
  if (total >= 250_000) return 'large'
  if (total >= 50_000) return 'mid'
  if (total >= 10_000) return 'micro'
  return 'nano'
}
