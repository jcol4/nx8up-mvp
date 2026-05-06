import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveCreatorMissions } from '../mission-resolver'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { findUnique: vi.fn() },
    creator_missions: { findMany: vi.fn(), update: vi.fn() },
    campaign_applications: { count: vi.fn() },
    deal_submissions: { count: vi.fn() },
  },
}))

vi.mock('../reputation', () => ({
  adjustCreatorReputation: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({ publicMetadata: { creatorLevel: 1, creatorXp: 0, creatorXpForNext: 500 } }),
      updateUser: vi.fn().mockResolvedValue({}),
    },
  }),
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}))

import { adjustCreatorReputation } from '../reputation'

const WEEK_START = new Date('2026-05-05T00:00:00.000Z') // Monday

function makeCreator(overrides = {}) {
  return {
    id: 'creator-1',
    clerk_user_id: 'clerk-1',
    stripe_onboarding_complete: false,
    twitch_id: null,
    youtube_channel_id: null,
    twitch_synced_at: null,
    youtube_synced_at: null,
    platform: [],
    creator_types: [],
    game_category: [],
    content_type: [],
    audience_age_min: null,
    audience_locations: [],
    audience_interests: [],
    audience_gender: [],
    preferred_campaign_types: [],
    preferred_product_types: [],
    is_available: false,
    ...overrides,
  }
}

function makeMission(missionId: string, missionType: string, weekStart: Date | null = null) {
  return { id: `row-${missionId}`, mission_id: missionId, mission_type: missionType, week_start: weekStart, completed: false }
}

afterEach(() => {
  vi.clearAllMocks()
})

// ── Gate mission: stripe ─────────────────────────────────────────────────────

describe('resolveCreatorMissions — gate:stripe', () => {
  it('marks stripe mission complete when stripe_onboarding_complete is true', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ stripe_onboarding_complete: true }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('stripe', 'gate'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(prisma.creator_missions.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'row-stripe' }, data: expect.objectContaining({ completed: true }) })
    )
    expect(result.completed).toContain('stripe')
  })

  it('does not complete stripe mission when stripe_onboarding_complete is false', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ stripe_onboarding_complete: false }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('stripe', 'gate'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(prisma.creator_missions.update).not.toHaveBeenCalled()
    expect(result.completed).toHaveLength(0)
  })
})

// ── Gate mission: platform ────────────────────────────────────────────────────

describe('resolveCreatorMissions — gate:platform', () => {
  it('marks platform mission complete when twitch_id is set', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ twitch_id: 'twitch-123' }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('platform', 'gate'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(result.completed).toContain('platform')
  })

  it('marks platform mission complete when youtube_channel_id is set', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ youtube_channel_id: 'yt-123' }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('platform', 'gate'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(result.completed).toContain('platform')
  })
})

// ── Field mission ────────────────────────────────────────────────────────────

describe('resolveCreatorMissions — field missions', () => {
  it('completes field_game_category when game_category is non-empty', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ game_category: ['FPS'] }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('field_game_category', 'field'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(result.completed).toContain('field_game_category')
  })

  it('does not complete field mission when field is empty', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ game_category: [] }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('field_game_category', 'field'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(result.completed).toHaveLength(0)
  })
})

// ── Weekly mission ────────────────────────────────────────────────────────────

describe('resolveCreatorMissions — weekly:apply_campaign', () => {
  it('completes when creator has applied to a campaign this week', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(makeCreator() as any)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('weekly_apply_campaign', 'weekly', WEEK_START),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(1)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(result.completed).toContain('weekly_apply_campaign')
  })

  it('does not complete when no applications this week', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(makeCreator() as any)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('weekly_apply_campaign', 'weekly', WEEK_START),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(result.completed).toHaveLength(0)
  })
})

// ── XP award on completion ───────────────────────────────────────────────────

describe('resolveCreatorMissions — XP award', () => {
  it('awards XP equal to the mission xp value when mission completes', async () => {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const mockUpdateUser = vi.fn().mockResolvedValue({})
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({ publicMetadata: { creatorLevel: 1, creatorXp: 0, creatorXpForNext: 500 } }),
        updateUser: mockUpdateUser,
      },
    } as any)

    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ stripe_onboarding_complete: true }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('stripe', 'gate'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    await resolveCreatorMissions('creator-1')

    expect(mockUpdateUser).toHaveBeenCalledWith(
      'clerk-1',
      expect.objectContaining({
        publicMetadata: expect.objectContaining({ creatorXp: 200 }),
      })
    )
  })

  it('triggers +1 reputation on level-up', async () => {
    const { clerkClient } = await import('@clerk/nextjs/server')
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        // Already at 499 XP — stripe mission (200 XP) pushes past 500 threshold
        getUser: vi.fn().mockResolvedValue({ publicMetadata: { creatorLevel: 1, creatorXp: 499, creatorXpForNext: 500 } }),
        updateUser: vi.fn().mockResolvedValue({}),
      },
    } as any)

    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(
      makeCreator({ stripe_onboarding_complete: true }) as any
    )
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      makeMission('stripe', 'gate'),
    ] as any)
    vi.mocked(prisma.creator_missions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('creator-1')

    expect(adjustCreatorReputation).toHaveBeenCalledWith('creator-1', 1)
    expect(result.levelsGained).toBe(1)
  })
})

// ── Returns early when creator not found ──────────────────────────────────────

describe('resolveCreatorMissions — edge cases', () => {
  it('returns empty result when creator not found', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([])
    vi.mocked(prisma.campaign_applications.count).mockResolvedValue(0)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)

    const result = await resolveCreatorMissions('missing')

    expect(result.completed).toHaveLength(0)
    expect(result.levelsGained).toBe(0)
  })
})
