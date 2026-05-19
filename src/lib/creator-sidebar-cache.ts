import { unstable_cache, revalidateTag } from 'next/cache'
import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getRankName } from '@/lib/creator-xp'

export function creatorSidebarCacheTag(clerkUserId: string) {
  return `creator-sidebar:${clerkUserId}`
}

export type CreatorSidebarStats = {
  level: number
  rankName: string
  averageVodViews: number | null
  twitchUsername: string | null
  youtubeChannelName: string | null
}

export function getCreatorSidebarStatsCached(clerkUserId: string) {
  return unstable_cache(
    async (): Promise<CreatorSidebarStats> => {
      const [creator, clerkUser] = await Promise.all([
        prisma.content_creators.findUnique({
          where: { clerk_user_id: clerkUserId },
          select: {
            average_vod_views: true,
            twitch_username: true,
            youtube_channel_name: true,
          },
        }),
        (await clerkClient()).users.getUser(clerkUserId),
      ])
      const meta = (clerkUser.publicMetadata || {}) as Record<string, unknown>
      const level = Math.max(1, Number(meta.creatorLevel) || 1)
      return {
        level,
        rankName: getRankName(level),
        averageVodViews: creator?.average_vod_views ?? null,
        twitchUsername: creator?.twitch_username ?? null,
        youtubeChannelName: creator?.youtube_channel_name ?? null,
      }
    },
    ['creator-sidebar-stats', clerkUserId],
    { revalidate: 30, tags: [creatorSidebarCacheTag(clerkUserId)] },
  )()
}

export function revalidateCreatorSidebarCache(clerkUserId: string) {
  revalidateTag(creatorSidebarCacheTag(clerkUserId), 'default')
}
