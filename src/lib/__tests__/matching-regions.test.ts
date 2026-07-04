import { describe, it, expect } from 'vitest'
import { matchCreatorToCampaign, type CampaignCriteria, type CreatorForMatching } from '../matching'

/** Minimal campaign specifying only platform + audience location/region criteria. */
function campaign(overrides: Partial<CampaignCriteria> = {}): CampaignCriteria {
  return {
    platform: ['YouTube', 'Twitch'],
    min_subs_followers: null,
    min_avg_viewers: null,
    min_engagement_rate: null,
    min_audience_age: null,
    max_audience_age: null,
    required_audience_locations: ['United States'],
    required_audience_regions: ['us_west'],
    target_genders: [],
    target_interests: [],
    creator_types: [],
    creator_sizes: [],
    game_category: [],
    content_type: [],
    campaign_type: null,
    product_type: null,
    ...overrides,
  }
}

function creator(overrides: Partial<CreatorForMatching> = {}): CreatorForMatching {
  return {
    platform: ['YouTube'], // 0.5 platform ratio → keeps score off the 100 clamp
    subs_followers: null,
    youtube_subscribers: null,
    average_vod_views: null,
    youtube_avg_views: null,
    engagement_rate: null,
    audience_age_min: null,
    audience_age_max: null,
    audience_locations: ['United States'],
    audience_regions: [],
    audience_gender: [],
    audience_interests: [],
    creator_types: [],
    creator_size: null,
    game_category: [],
    content_type: [],
    preferred_campaign_types: [],
    preferred_product_types: [],
    is_available: true,
    ...overrides,
  }
}

describe('matchCreatorToCampaign — region bonus', () => {
  it('awards the full region bonus when the creator has the matching region', () => {
    const full = matchCreatorToCampaign(creator({ audience_regions: ['us_west'] }), campaign()).score
    const partial = matchCreatorToCampaign(creator({ audience_regions: [] }), campaign()).score
    expect(full).toBeGreaterThan(partial)
  })

  it('awards half credit when the creator has only the parent country, no region', () => {
    const partial = matchCreatorToCampaign(creator({ audience_regions: [] }), campaign()).score
    const none = matchCreatorToCampaign(
      creator({ audience_regions: [], audience_locations: ['Brazil'] }),
      campaign(),
    ).score
    expect(partial).toBeGreaterThan(none)
  })

  it('does not change the score when the campaign specifies no region targeting', () => {
    const noRegionCampaign = campaign({ required_audience_regions: [] })
    const withRegionData = matchCreatorToCampaign(creator({ audience_regions: ['us_west'] }), noRegionCampaign).score
    const withoutRegionData = matchCreatorToCampaign(creator({ audience_regions: [] }), noRegionCampaign).score
    expect(withRegionData).toBe(withoutRegionData)
  })

  it('never lets the final score exceed 100 when the bonus applies', () => {
    // Campaign specifies only location + region, so a perfect creator would clamp.
    const locOnly = campaign({ platform: [], required_audience_locations: ['United States'], required_audience_regions: ['us_west'] })
    const score = matchCreatorToCampaign(creator({ platform: [], audience_regions: ['us_west'] }), locOnly).score
    expect(score).toBeLessThanOrEqual(100)
  })
})
