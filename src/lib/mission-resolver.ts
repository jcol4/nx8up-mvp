'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { MISSIONS } from './missions'
import { addXpToState, getRankName, getXpForNextLevel } from './creator-xp'
import { recordReputationEvent } from './reputation'
import { createNotification } from './notifications'
import { NOTIFICATION_TYPES } from './notification-types'

type ResolveResult = {
  completed: string[]
  levelsGained: number
}

function parseXpState(meta: Record<string, unknown>) {
  const xp = Number(meta.creatorXp) || 0
  const level = Math.max(1, Number(meta.creatorLevel) || 1)
  const xpForNext = Number(meta.creatorXpForNext) || getXpForNextLevel(level)
  return { xp, level, xpForNext, rankName: getRankName(level) }
}

function isMissionComplete(
  missionId: string,
  creator: Record<string, unknown>,
  weekStart: Date | null,
  applicationCount: number,
  dealCount: number,
  acceptedCount: number,
  inviteCount: number,
  apply3Count: number
): boolean {
  switch (missionId) {
    case 'stripe':
      return creator.stripe_onboarding_complete === true
    case 'platform':
      return creator.twitch_id != null || creator.youtube_channel_id != null
    case 'field_platforms':
      return (creator.platform as string[]).length > 0
    case 'field_creator_types':
      return (creator.creator_types as string[]).length > 0
    case 'field_game_category':
      return (creator.game_category as string[]).length > 0
    case 'field_content_type':
      return (creator.content_type as string[]).length > 0
    case 'field_audience_age':
      return creator.audience_age_min != null
    case 'field_audience_locations':
      return (creator.audience_locations as string[]).length > 0
    case 'field_audience_interests':
      return (creator.audience_interests as string[]).length > 0
    case 'field_audience_gender':
      return (creator.audience_gender as string[]).length > 0
    case 'field_preferred_campaign_types':
      return (creator.preferred_campaign_types as string[]).length > 0
    case 'field_preferred_product_types':
      return (creator.preferred_product_types as string[]).length > 0
    case 'field_is_available':
      return creator.is_available === true
    case 'weekly_twitch_sync': {
      const syncedAt = creator.twitch_synced_at as Date | null
      return weekStart != null && syncedAt != null && syncedAt >= weekStart
    }
    case 'weekly_youtube_sync': {
      const syncedAt = creator.youtube_synced_at as Date | null
      return weekStart != null && syncedAt != null && syncedAt >= weekStart
    }
    case 'weekly_apply_campaign':
      return applicationCount >= 1
    case 'weekly_submit_proof':
      return dealCount >= 1
    case 'weekly_accepted_application':
      return acceptedCount >= 1
    case 'weekly_respond_invite':
      return inviteCount >= 1
    case 'weekly_apply_3_campaigns':
      return apply3Count >= 3
    default:
      return false
  }
}

export async function resolveCreatorMissions(creatorId: string): Promise<ResolveResult> {
  const creator = await prisma.content_creators.findUnique({
    where: { id: creatorId },
    select: {
      id: true,
      clerk_user_id: true,
      stripe_onboarding_complete: true,
      twitch_id: true,
      youtube_channel_id: true,
      twitch_synced_at: true,
      youtube_synced_at: true,
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

  if (!creator) return { completed: [], levelsGained: 0 }

  const assigned = await prisma.creator_missions.findMany({
    where: { creator_id: creatorId, completed: false },
  })

  if (assigned.length === 0) return { completed: [], levelsGained: 0 }

  // Collect all week_start values for weekly missions to batch-query activity
  const weeklyMissions = assigned.filter((m) => m.mission_type === 'weekly' && m.week_start != null)
  const weekStart = weeklyMissions[0]?.week_start ?? null

  let applicationCount = 0
  let dealCount = 0
  let acceptedCount = 0
  let inviteCount = 0

  if (weekStart) {
    ;[applicationCount, dealCount, acceptedCount, inviteCount] = await Promise.all([
      prisma.campaign_applications.count({
        where: { creator_id: creatorId, submitted_at: { gte: weekStart } },
      }),
      prisma.deal_submissions.count({
        where: { application: { creator_id: creatorId }, submitted_at: { gte: weekStart } },
      }),
      prisma.campaign_applications.count({
        where: { creator_id: creatorId, status: 'accepted', submitted_at: { gte: weekStart } },
      }),
      prisma.campaign_applications.count({
        where: { creator_id: creatorId, submitted_at: { gte: weekStart }, campaign: { is_direct_invite: true } },
      }),
    ])
  }

  const completedIds: string[] = []
  const now = new Date()

  for (const row of assigned) {
    const done = isMissionComplete(
      row.mission_id,
      creator as Record<string, unknown>,
      row.week_start,
      applicationCount,
      dealCount,
      acceptedCount,
      inviteCount,
      applicationCount
    )
    if (!done) continue

    await prisma.creator_missions.update({
      where: { id: row.id },
      data: { completed: true, completed_at: now },
    })
    completedIds.push(row.mission_id)
  }

  if (completedIds.length === 0) return { completed: [], levelsGained: 0 }

  const totalXp = completedIds.reduce((sum, missionId) => {
    const mission = MISSIONS.find((m) => m.id === missionId)
    return sum + (mission?.xp ?? 0)
  }, 0)

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(creator.clerk_user_id)
  const meta = (clerkUser.publicMetadata || {}) as Record<string, unknown>
  const current = parseXpState(meta)
  const next = addXpToState(current, totalXp)
  const levelsGained = next.level - current.level

  await client.users.updateUser(creator.clerk_user_id, {
    publicMetadata: {
      ...meta,
      creatorXp: next.xp,
      creatorLevel: next.level,
      creatorXpForNext: next.xpForNext,
    },
  })

  if (levelsGained > 0) {
    await recordReputationEvent({ type: 'leveled_up', creatorId, levelsGained })
    await createNotification({
      userId: creator.clerk_user_id,
      role: 'creator',
      type: NOTIFICATION_TYPES.LEVEL_UP,
      title: `Level ${next.level}`,
      message: `Rank updated to ${next.rankName}.`,
      link: '/creator',
    })
  }

  return { completed: completedIds, levelsGained }
}
