/**
 * Matching engine — determines whether a creator meets a campaign's criteria.
 * Used on both client listing (show eligibility badges) and server actions (guard apply).
 */

export type CampaignCriteria = {
  platform: string[]
  min_subs_followers: number | null
  min_avg_viewers: number | null
  min_engagement_rate: { toNumber(): number } | number | null
  min_audience_age: number | null
  max_audience_age: number | null
  required_audience_locations: string[]
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
}

export type MatchResult = {
  eligible: boolean
  reasons: string[]
}

function toNum(v: { toNumber(): number } | number | null): number | null {
  if (v == null) return null
  return typeof v === 'object' ? v.toNumber() : v
}

export function matchCreatorToCampaign(
  creator: CreatorForMatching,
  campaign: CampaignCriteria,
): MatchResult {
  const reasons: string[] = []

  // Platform — only check if creator has platforms set and none overlap
  if (campaign.platform.length > 0 && creator.platform.length > 0) {
    const overlap = campaign.platform.some((p) => creator.platform.includes(p))
    if (!overlap) {
      reasons.push(
        `Platform: campaign requires ${campaign.platform.join(' or ')}, your profile shows ${creator.platform.join(', ')}`,
      )
    }
  }

  // Min followers / subscribers — use best across Twitch + YouTube
  if (campaign.min_subs_followers != null) {
    const hasData = creator.subs_followers != null || creator.youtube_subscribers != null
    if (hasData) {
      const best = Math.max(creator.subs_followers ?? 0, creator.youtube_subscribers ?? 0)
      if (best < campaign.min_subs_followers) {
        reasons.push(
          `Min ${campaign.min_subs_followers.toLocaleString()} followers/subscribers required (you have ${best.toLocaleString()})`,
        )
      }
    }
  }

  // Min avg views — use best across Twitch VOD + YouTube
  if (campaign.min_avg_viewers != null) {
    const hasData = creator.average_vod_views != null || creator.youtube_avg_views != null
    if (hasData) {
      const best = Math.max(creator.average_vod_views ?? 0, creator.youtube_avg_views ?? 0)
      if (best < campaign.min_avg_viewers) {
        reasons.push(
          `Min ${campaign.min_avg_viewers.toLocaleString()} avg views required (you have ${best.toLocaleString()})`,
        )
      }
    }
  }

  // Min engagement rate
  const campaignRate = toNum(campaign.min_engagement_rate)
  const creatorRate = toNum(creator.engagement_rate)
  if (campaignRate != null && creatorRate != null) {
    if (creatorRate < campaignRate) {
      reasons.push(
        `Min ${campaignRate.toFixed(1)}% engagement rate required (you have ${creatorRate.toFixed(2)}%)`,
      )
    }
  }

  // Audience age — requires overlap between creator's range and campaign's target range
  if (
    (campaign.min_audience_age != null || campaign.max_audience_age != null) &&
    creator.audience_age_min != null &&
    creator.audience_age_max != null
  ) {
    const cMin = campaign.min_audience_age ?? 0
    const cMax = campaign.max_audience_age ?? 120
    const overlaps = creator.audience_age_min <= cMax && creator.audience_age_max >= cMin
    if (!overlaps) {
      const range =
        campaign.min_audience_age != null && campaign.max_audience_age != null
          ? `${campaign.min_audience_age}–${campaign.max_audience_age}`
          : campaign.min_audience_age != null
            ? `${campaign.min_audience_age}+`
            : `up to ${campaign.max_audience_age}`
      reasons.push(
        `Audience age target is ${range} — your audience is ${creator.audience_age_min}–${creator.audience_age_max}`,
      )
    }
  }

  // Audience locations — creator must have at least one overlap
  if (
    campaign.required_audience_locations.length > 0 &&
    creator.audience_locations.length > 0
  ) {
    const overlap = campaign.required_audience_locations.some((loc) =>
      creator.audience_locations.includes(loc),
    )
    if (!overlap) {
      reasons.push(
        `Audience location: campaign targets ${campaign.required_audience_locations.join(', ')}`,
      )
    }
  }

  return { eligible: reasons.length === 0, reasons }
}
