import { describe, it, expect, vi, afterEach } from 'vitest'
import { assignWeeklyMissions, currentWeekStart } from '../mission-assignment'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { findUnique: vi.fn() },
    creator_missions: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

const CREATOR = { id: 'creator-1', stripe_onboarding_complete: false, twitch_id: null, youtube_channel_id: null }

// ── currentWeekStart ─────────────────────────────────────────────────────────

describe('currentWeekStart', () => {
  it('returns a Monday at 00:00:00.000 UTC', () => {
    const ws = currentWeekStart()
    expect(ws.getUTCDay()).toBe(1)
    expect(ws.getUTCHours()).toBe(0)
    expect(ws.getUTCMinutes()).toBe(0)
    expect(ws.getUTCSeconds()).toBe(0)
    expect(ws.getUTCMilliseconds()).toBe(0)
  })
})

// ── assignWeeklyMissions ─────────────────────────────────────────────────────

describe('assignWeeklyMissions — new creator', () => {
  it('assigns exactly 3 missions', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(CREATOR as any)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([])
    vi.mocked(prisma.creator_missions.createMany).mockResolvedValue({ count: 3 })

    await assignWeeklyMissions('creator-1')

    const callArg = vi.mocked(prisma.creator_missions.createMany).mock.calls[0]?.[0]
    expect((callArg!.data as unknown[]).length).toBe(3)
  })

  it('pins both gate missions when neither is complete', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(CREATOR as any)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([])
    vi.mocked(prisma.creator_missions.createMany).mockResolvedValue({ count: 3 })

    await assignWeeklyMissions('creator-1')

    const callArg = vi.mocked(prisma.creator_missions.createMany).mock.calls[0]?.[0]
    const missionIds = (callArg!.data as { mission_id: string }[]).map((d) => d.mission_id)
    expect(missionIds).toContain('stripe')
    expect(missionIds).toContain('platform')
  })

  it('does not assign gate mission that is already permanently completed', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({
      ...CREATOR,
      stripe_onboarding_complete: true,
      twitch_id: null,
    } as any)
    // stripe already permanently completed in DB
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      { mission_id: 'stripe', mission_type: 'gate', week_start: null, completed: true },
    ] as any)
    vi.mocked(prisma.creator_missions.createMany).mockResolvedValue({ count: 3 })

    await assignWeeklyMissions('creator-1')

    const callArg = vi.mocked(prisma.creator_missions.createMany).mock.calls[0]?.[0]
    const missionIds = (callArg!.data as { mission_id: string }[]).map((d) => d.mission_id)
    expect(missionIds).not.toContain('stripe')
    expect(missionIds).toContain('platform')
  })
})

describe('assignWeeklyMissions — idempotency', () => {
  it('does nothing if creator already has missions assigned this week', async () => {
    const weekStart = currentWeekStart()
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(CREATOR as any)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      { mission_id: 'stripe', mission_type: 'gate', week_start: null, completed: false },
      { mission_id: 'platform', mission_type: 'gate', week_start: null, completed: false },
      { mission_id: 'weekly_apply_campaign', mission_type: 'weekly', week_start: weekStart, completed: false },
    ] as any)

    await assignWeeklyMissions('creator-1')

    expect(prisma.creator_missions.createMany).not.toHaveBeenCalled()
  })
})

describe('assignWeeklyMissions — no-repeat rule', () => {
  it('excludes last week weekly mission IDs from this week draw', async () => {
    // Creator with both gates + all fields done → only weekly pool remains
    const fullyComplete = {
      id: 'creator-1',
      stripe_onboarding_complete: true,
      twitch_id: 'tw-1',
      youtube_channel_id: null,
      platform: ['Twitch'],
      creator_types: ['Streamer'],
      game_category: ['FPS'],
      content_type: ['Stream'],
      audience_age_min: 18,
      audience_locations: ['US'],
      audience_interests: ['Gaming'],
      audience_gender: ['Male'],
      preferred_campaign_types: ['Sponsored'],
      preferred_product_types: ['Gaming Gear'],
      is_available: true,
    }

    const lastWeekStart = new Date(currentWeekStart())
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7)

    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(fullyComplete as any)
    vi.mocked(prisma.creator_missions.findMany).mockResolvedValue([
      // All gate + field permanently completed
      { mission_id: 'stripe', mission_type: 'gate', week_start: null, completed: true },
      { mission_id: 'platform', mission_type: 'gate', week_start: null, completed: true },
      { mission_id: 'field_platforms', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_creator_types', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_game_category', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_content_type', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_audience_age', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_audience_locations', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_audience_interests', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_audience_gender', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_preferred_campaign_types', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_preferred_product_types', mission_type: 'field', week_start: null, completed: true },
      { mission_id: 'field_is_available', mission_type: 'field', week_start: null, completed: true },
      // Last week's 3 weekly missions
      { mission_id: 'weekly_apply_campaign', mission_type: 'weekly', week_start: lastWeekStart, completed: true },
      { mission_id: 'weekly_submit_proof', mission_type: 'weekly', week_start: lastWeekStart, completed: false },
      { mission_id: 'weekly_accepted_application', mission_type: 'weekly', week_start: lastWeekStart, completed: false },
    ] as any)
    vi.mocked(prisma.creator_missions.createMany).mockResolvedValue({ count: 3 })

    await assignWeeklyMissions('creator-1')

    const callArg = vi.mocked(prisma.creator_missions.createMany).mock.calls[0]?.[0]
    const missionIds = (callArg!.data as { mission_id: string }[]).map((d) => d.mission_id)
    expect(missionIds).not.toContain('weekly_apply_campaign')
    expect(missionIds).not.toContain('weekly_submit_proof')
    expect(missionIds).not.toContain('weekly_accepted_application')
  })
})
