import { prisma } from './prisma'
import { MISSIONS } from './missions'

export function currentWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const daysToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToMonday))
  return monday
}

function lastWeekStart(): Date {
  const ws = currentWeekStart()
  ws.setUTCDate(ws.getUTCDate() - 7)
  return ws
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export async function assignWeeklyMissions(creatorId: string): Promise<void> {
  const creator = await prisma.content_creators.findUnique({
    where: { id: creatorId },
    select: {
      id: true,
      stripe_onboarding_complete: true,
      twitch_id: true,
      youtube_channel_id: true,
      platform: true,
      creator_types: true,
      game_category: true,
      content_type: true,
      audience_age_min: true,
      audience_locations: true,
      audience_interests: true,
      audience_gender: true,
      preferred_campaign_types: true,
      preferred_product_types: true,
      is_available: true,
    },
  })

  if (!creator) return

  const weekStart = currentWeekStart()

  // Fetch all existing mission records for this creator
  const allRecords = await prisma.creator_missions.findMany({
    where: { creator_id: creatorId },
    select: { mission_id: true, mission_type: true, week_start: true, completed: true },
  })

  // Check idempotency — already assigned this week
  const thisWeekAssigned = allRecords.filter(
    (r) => r.week_start !== null && r.week_start.getTime() === weekStart.getTime()
  )
  const permanentAssigned = allRecords.filter((r) => r.mission_type !== 'weekly' && r.week_start === null)

  // Count active (incomplete or permanent) slots already assigned this week
  const activeThisWeek = [
    ...permanentAssigned.filter((r) => !r.completed),
    ...thisWeekAssigned,
  ]
  if (activeThisWeek.length >= 3) return

  const completedPermanentIds = new Set(
    allRecords.filter((r) => r.week_start === null && r.completed).map((r) => r.mission_id)
  )
  const pendingPermanentIds = new Set(
    allRecords.filter((r) => r.week_start === null && !r.completed).map((r) => r.mission_id)
  )

  // Last week's weekly mission IDs (for no-repeat rule)
  const lwStart = lastWeekStart()
  const lastWeekIds = new Set(
    allRecords
      .filter((r) => r.week_start !== null && r.week_start.getTime() === lwStart.getTime())
      .map((r) => r.mission_id)
  )

  const slots: { mission_id: string; mission_type: string; week_start: Date | null }[] = []

  // Slot gate missions (pinned if not permanently completed and not already pending)
  for (const m of MISSIONS.filter((m) => m.type === 'gate')) {
    if (slots.length >= 3) break
    if (completedPermanentIds.has(m.id)) continue
    if (pendingPermanentIds.has(m.id)) continue
    slots.push({ mission_id: m.id, mission_type: 'gate', week_start: null })
  }

  // Fill with incomplete field missions
  if (slots.length < 3) {
    const pendingFields = MISSIONS.filter(
      (m) => m.type === 'field' && !completedPermanentIds.has(m.id) && !pendingPermanentIds.has(m.id)
    )
    for (const m of pendingFields) {
      if (slots.length >= 3) break
      slots.push({ mission_id: m.id, mission_type: 'field', week_start: null })
    }
  }

  // Fill remaining slots from weekly pool (excluding last week's IDs)
  if (slots.length < 3) {
    const alreadyThisWeekIds = new Set([...thisWeekAssigned.map((r) => r.mission_id)])
    const availableWeekly = MISSIONS.filter(
      (m) => m.type === 'weekly' && !lastWeekIds.has(m.id) && !alreadyThisWeekIds.has(m.id)
    )
    const needed = 3 - slots.length
    const picked = pickRandom(availableWeekly, needed)
    for (const m of picked) {
      slots.push({ mission_id: m.id, mission_type: 'weekly', week_start: weekStart })
    }
  }

  if (slots.length === 0) return

  await prisma.creator_missions.createMany({
    data: slots.map((s) => ({
      creator_id: creatorId,
      mission_id: s.mission_id,
      mission_type: s.mission_type,
      week_start: s.week_start,
    })),
    skipDuplicates: true,
  })
}
