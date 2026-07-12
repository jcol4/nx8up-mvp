import { describe, it, expect } from 'vitest'
import {
  matchCreatorToCampaign,
  computeCreatorSize,
  type CampaignCriteria,
  type CreatorForMatching,
} from '../matching'

/**
 * Blank baselines: a campaign that specifies *no* criteria (every dimension
 * null/empty) and an available creator with *no* profile data. Each test opts
 * exactly one dimension in via overrides, so the assertion isolates that
 * dimension's contribution to the score / eligibility contract.
 */
function campaign(overrides: Partial<CampaignCriteria> = {}): CampaignCriteria {
  return {
    platform: [],
    min_subs_followers: null,
    min_avg_viewers: null,
    min_engagement_rate: null,
    min_audience_age: null,
    max_audience_age: null,
    required_audience_locations: [],
    required_audience_regions: [],
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
    platform: [],
    subs_followers: null,
    youtube_subscribers: null,
    average_vod_views: null,
    youtube_avg_views: null,
    engagement_rate: null,
    audience_age_min: null,
    audience_age_max: null,
    audience_locations: [],
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

// ─── Global contract invariants ──────────────────────────────────────────────

describe('matchCreatorToCampaign — contract invariants', () => {
  it('score is always an integer in [0, 100] and eligible ⇔ no reasons', () => {
    const combos = [
      matchCreatorToCampaign(creator(), campaign()),
      matchCreatorToCampaign(creator({ is_available: false }), campaign()),
      matchCreatorToCampaign(
        creator({ subs_followers: 10, platform: ['twitch'] }),
        campaign({ min_subs_followers: 100000, platform: ['youtube'] }),
      ),
      matchCreatorToCampaign(
        creator({ platform: ['twitch', 'youtube'], game_category: ['valorant'] }),
        campaign({ platform: ['twitch', 'youtube'], game_category: ['fps'] }),
      ),
    ]
    for (const r of combos) {
      expect(Number.isInteger(r.score)).toBe(true)
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.eligible).toBe(r.reasons.length === 0)
    }
  })

  it('a campaign specifying no criteria scores a blank creator 100 and eligible', () => {
    const r = matchCreatorToCampaign(creator(), campaign())
    expect(r.score).toBe(100)
    expect(r.eligible).toBe(true)
    expect(r.reasons).toEqual([])
  })
})

// ─── Hard blocks: availability + numeric minimums ────────────────────────────

describe('matchCreatorToCampaign — hard blocks', () => {
  it('blocks an unavailable creator regardless of a perfect profile', () => {
    const r = matchCreatorToCampaign(
      creator({ is_available: false, platform: ['twitch'] }),
      campaign({ platform: ['twitch'] }),
    )
    expect(r.eligible).toBe(false)
    expect(r.reasons.some((x) => /unavailable/i.test(x))).toBe(true)
  })

  it('accumulates multiple hard-block reasons', () => {
    const r = matchCreatorToCampaign(
      creator({ is_available: false, subs_followers: 1 }),
      campaign({ min_subs_followers: 100000 }),
    )
    expect(r.eligible).toBe(false)
    expect(r.reasons.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── 67% tolerance boundary + data-gating fairness invariant ─────────────────

describe('matchCreatorToCampaign — numeric minimums (67% tolerance)', () => {
  it('blocks when combined followers fall below 67% of the requirement', () => {
    // 600 / 1000 = 60% < 67% → hard block
    const r = matchCreatorToCampaign(
      creator({ subs_followers: 600 }),
      campaign({ min_subs_followers: 1000 }),
    )
    expect(r.eligible).toBe(false)
    expect(r.reasons.some((x) => /follower/i.test(x))).toBe(true)
  })

  it('admits (with a note, not a block) when within the 67% tolerance band', () => {
    // 700 / 1000 = 70% ≥ 67% → eligible, informational note only
    const r = matchCreatorToCampaign(
      creator({ subs_followers: 700 }),
      campaign({ min_subs_followers: 1000 }),
    )
    expect(r.eligible).toBe(true)
    expect(r.reasons).toEqual([])
    expect(r.notes.some((x) => /tolerance/i.test(x))).toBe(true)
  })

  it('admits cleanly (no note) at or above the requirement', () => {
    const r = matchCreatorToCampaign(
      creator({ subs_followers: 1000 }),
      campaign({ min_subs_followers: 1000 }),
    )
    expect(r.eligible).toBe(true)
    expect(r.notes.some((x) => /tolerance/i.test(x))).toBe(false)
  })

  it('sums followers across platforms before comparing to the minimum', () => {
    // 6000 alone would block (60%); combined 12000 clears the bar.
    const r = matchCreatorToCampaign(
      creator({ subs_followers: 6000, youtube_subscribers: 6000 }),
      campaign({ min_subs_followers: 10000 }),
    )
    expect(r.eligible).toBe(true)
    expect(r.reasons).toEqual([])
  })

  it('does NOT block a creator who simply has no follower data (missing ≠ fail)', () => {
    // Fairness/security invariant: absent metrics must not hard-disqualify.
    const r = matchCreatorToCampaign(
      creator({ subs_followers: null, youtube_subscribers: null }),
      campaign({ min_subs_followers: 100000 }),
    )
    expect(r.eligible).toBe(true)
    expect(r.reasons).toEqual([])
  })

  it('applies the same tolerance rule to average viewers', () => {
    const blocked = matchCreatorToCampaign(
      creator({ average_vod_views: 500 }),
      campaign({ min_avg_viewers: 1000 }),
    )
    const admitted = matchCreatorToCampaign(
      creator({ average_vod_views: 700 }),
      campaign({ min_avg_viewers: 1000 }),
    )
    expect(blocked.eligible).toBe(false)
    expect(admitted.eligible).toBe(true)
  })

  it('unwraps a Prisma Decimal CTR and applies the tolerance rule', () => {
    const decimal = (n: number) => ({ toNumber: () => n })
    const r = matchCreatorToCampaign(
      creator({ engagement_rate: decimal(2.0) }), // 2.0 / 5.0 = 40% < 67%
      campaign({ min_engagement_rate: decimal(5.0) }),
    )
    expect(r.eligible).toBe(false)
    expect(r.reasons.some((x) => /CTR/i.test(x))).toBe(true)
  })
})

// ─── Soft criteria never block ───────────────────────────────────────────────

describe('matchCreatorToCampaign — soft criteria are informational only', () => {
  it('a total platform mismatch lowers the score but keeps the creator eligible', () => {
    const r = matchCreatorToCampaign(
      creator({ platform: ['youtube'] }),
      campaign({ platform: ['twitch'] }),
    )
    expect(r.eligible).toBe(true)
    expect(r.score).toBe(0) // platform is the only weighted dimension, 0 overlap
    expect(r.notes.some((x) => /platform/i.test(x))).toBe(true)
  })

  it('scores partial platform overlap proportionally', () => {
    const r = matchCreatorToCampaign(
      creator({ platform: ['twitch'] }),
      campaign({ platform: ['twitch', 'youtube'] }),
    )
    expect(r.score).toBe(50) // 1 of 2 required platforms matched
    expect(r.eligible).toBe(true)
  })
})

// ─── Tag matching: normalization + synonym expansion ─────────────────────────

describe('matchCreatorToCampaign — tag matching', () => {
  it('credits a synonym-equivalent game category as a full match', () => {
    const r = matchCreatorToCampaign(
      creator({ game_category: ['Valorant'] }),
      campaign({ game_category: ['FPS'] }),
    )
    expect(r.score).toBe(100) // fps ⇄ valorant via SYNONYMS
    expect(r.notes.some((x) => /game categor/i.test(x))).toBe(false)
  })

  it('gives an unrelated game category zero credit but stays eligible', () => {
    const r = matchCreatorToCampaign(
      creator({ game_category: ['Cooking'] }),
      campaign({ game_category: ['FPS'] }),
    )
    expect(r.score).toBe(0)
    expect(r.eligible).toBe(true)
    expect(r.notes.some((x) => /game categor/i.test(x))).toBe(true)
  })

  it('matches tags across case and punctuation differences', () => {
    const r = matchCreatorToCampaign(
      creator({ content_type: ['lets play'] }),
      campaign({ content_type: ["Let's Play"] }),
    )
    expect(r.score).toBe(100) // normalize → both become "lets play"
  })

  it('matches audience interests by fuzzy substring', () => {
    const r = matchCreatorToCampaign(
      creator({ audience_interests: ['Competitive Gaming Highlights'] }),
      campaign({ target_interests: ['Gaming'] }),
    )
    expect(r.score).toBe(100) // "gaming" is a substring of the creator interest
  })
})

// ─── Gender wildcard ─────────────────────────────────────────────────────────

describe('matchCreatorToCampaign — gender "All" wildcard', () => {
  it('treats a creator "All" audience as matching any target gender', () => {
    const r = matchCreatorToCampaign(
      creator({ audience_gender: ['All'] }),
      campaign({ target_genders: ['Male'] }),
    )
    expect(r.score).toBe(100)
  })

  it('treats a campaign "All" target as matching any creator audience', () => {
    const r = matchCreatorToCampaign(
      creator({ audience_gender: ['Female'] }),
      campaign({ target_genders: ['All'] }),
    )
    expect(r.score).toBe(100)
  })

  it('scores a genuine gender mismatch at zero without blocking', () => {
    const r = matchCreatorToCampaign(
      creator({ audience_gender: ['Female'] }),
      campaign({ target_genders: ['Male'] }),
    )
    expect(r.score).toBe(0)
    expect(r.eligible).toBe(true)
  })
})

// ─── Preference scoring: 0.5 floor, never blocks ─────────────────────────────

describe('matchCreatorToCampaign — preference scoring', () => {
  it('awards full credit when the campaign type is in the creator preferences', () => {
    const r = matchCreatorToCampaign(
      creator({ preferred_campaign_types: ['Sponsored segment'] }),
      campaign({ campaign_type: 'Sponsored segment' }),
    )
    expect(r.score).toBe(100)
  })

  it('floors an unpreferred campaign type at half credit rather than zero', () => {
    const r = matchCreatorToCampaign(
      creator({ preferred_campaign_types: ['Full video'] }),
      campaign({ campaign_type: 'Sponsored segment' }),
    )
    expect(r.score).toBe(50) // 0.5 floor — a non-preference is not a rejection
    expect(r.eligible).toBe(true)
  })
})

// ─── Age-range overlap ───────────────────────────────────────────────────────

describe('matchCreatorToCampaign — audience age overlap', () => {
  it('does not note or block when the audience age range overlaps', () => {
    const r = matchCreatorToCampaign(
      creator({ audience_age_min: 25, audience_age_max: 34 }),
      campaign({ min_audience_age: 18, max_audience_age: 34 }),
    )
    expect(r.eligible).toBe(true)
    expect(r.notes.some((x) => /age/i.test(x))).toBe(false)
  })

  it('notes (without blocking) a disjoint audience age range', () => {
    const r = matchCreatorToCampaign(
      creator({ audience_age_min: 45, audience_age_max: 60 }),
      campaign({ min_audience_age: 18, max_audience_age: 34 }),
    )
    expect(r.eligible).toBe(true)
    expect(r.score).toBe(0)
    expect(r.notes.some((x) => /age/i.test(x))).toBe(true)
  })
})

// ─── computeCreatorSize buckets ──────────────────────────────────────────────

describe('computeCreatorSize', () => {
  it('returns null when there is no follower data at all', () => {
    expect(computeCreatorSize(null, null)).toBeNull()
    expect(computeCreatorSize(0, 0)).toBeNull()
  })

  it('buckets combined followers into the correct size tier', () => {
    expect(computeCreatorSize(9_999, null)).toBe('nano')
    expect(computeCreatorSize(10_000, null)).toBe('micro')
    expect(computeCreatorSize(49_999, null)).toBe('micro')
    expect(computeCreatorSize(50_000, null)).toBe('mid')
    expect(computeCreatorSize(249_999, null)).toBe('mid')
    expect(computeCreatorSize(250_000, null)).toBe('large')
  })

  it('sums Twitch and YouTube followers before bucketing', () => {
    // 5k + 6k = 11k → micro, though neither platform alone clears 10k.
    expect(computeCreatorSize(5_000, 6_000)).toBe('micro')
  })
})
