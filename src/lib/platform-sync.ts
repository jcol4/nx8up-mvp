/**
 * Creator platform sync — one seam for "refresh this creator's platform stats onto
 * their row, if stale."
 *
 * Each platform is an adapter ({@link CreatorPlatformSyncer}); {@link syncCreatorPlatform}
 * owns the shared skeleton (configured? → linked? → stale? → sync → recompute size →
 * recompute CTR → revalidate → swallow errors). Adding a platform means writing an
 * adapter, not another copy of the skeleton.
 *
 * Steam is intentionally NOT a syncer here: it has no staleness/follower/refresh
 * cadence — it's a read-only lookup (see steam.ts). It becomes an adapter if/when it
 * grows a sync cadence (a `steam_synced_at` column + a stale re-pull of games).
 */
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { computeCreatorSize } from '@/lib/matching'
import { revalidateCreatorSidebarCache } from '@/lib/creator-sidebar-cache'
import { triggerCtrRecomputeForUser } from '@/lib/oauth-callback-utils'
import { decryptToken, encryptToken } from '@/lib/token-encryption'
import { getTwitchUserById, getTwitchFollowerCount, getTwitchStreamStats } from '@/lib/twitch'
import { getYouTubeChannelById, getYouTubeChannelStats } from '@/lib/youtube'

/** The creator fields any syncer may read. One load covers every platform. */
const SYNC_CREATOR_SELECT = {
  twitch_id: true,
  twitch_synced_at: true,
  twitch_broadcaster_type: true,
  youtube_channel_id: true,
  youtube_synced_at: true,
  youtube_access_token: true,
  youtube_refresh_token: true,
  youtube_token_expires_at: true,
} satisfies Prisma.content_creatorsSelect

export type CreatorSyncRow = Prisma.content_creatorsGetPayload<{ select: typeof SYNC_CREATOR_SELECT }>

/** How stale a platform's data may be before {@link syncCreatorPlatform} re-fetches it. */
const DEFAULT_STALE_HOURS = 24

/** True if the last sync is older than `thresholdHours` (default 24h), or has never run. */
export function isPlatformDataStale(syncedAt: Date | null, thresholdHours = DEFAULT_STALE_HOURS): boolean {
  if (!syncedAt) return true
  const ageMs = Date.now() - new Date(syncedAt).getTime()
  return ageMs > thresholdHours * 60 * 60 * 1000
}

/** Context handed to an adapter's `sync` step. */
interface SyncContext {
  userId: string
  accountId: string
  creator: CreatorSyncRow
}

/**
 * A platform's adapter at the sync seam.
 *
 * `read` exposes the linked account id + last-sync so the orchestration can run the
 * shared guards (linked? stale?). `sync` fetches fresh stats and persists the
 * platform-specific columns, returning `false` if the account lookup failed (so the
 * orchestration skips the size/CTR recompute).
 */
export interface CreatorPlatformSyncer {
  readonly platform: 'twitch' | 'youtube'
  isConfigured(): boolean
  read(creator: CreatorSyncRow): { accountId: string; syncedAt: Date | null } | null
  sync(ctx: SyncContext): Promise<boolean>
}

/**
 * Refreshes one creator's data for `syncer`'s platform when it is stale. The shared
 * skeleton for every platform sync. Swallows and logs errors — this is called
 * fire-and-forget from the profile page.
 */
export async function syncCreatorPlatform(userId: string, syncer: CreatorPlatformSyncer): Promise<void> {
  if (!syncer.isConfigured()) return
  try {
    const creator = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: SYNC_CREATOR_SELECT,
    })
    if (!creator) return

    const linked = syncer.read(creator)
    if (!linked) return
    if (!isPlatformDataStale(linked.syncedAt)) return

    const updated = await syncer.sync({ userId, accountId: linked.accountId, creator })
    if (!updated) return

    await recomputeCreatorSize(userId)
    triggerCtrRecomputeForUser(userId).catch(console.error)
    revalidateCreatorSidebarCache(userId)
  } catch (err) {
    console.error(`syncCreatorPlatform(${syncer.platform}) error:`, err)
  }
}

/**
 * Recomputes and persists `creator_size` from the creator's current Twitch and
 * YouTube follower counts. Shared post-step so no single platform's sync owns the
 * cross-platform size formula.
 */
export async function recomputeCreatorSize(userId: string): Promise<void> {
  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { subs_followers: true, youtube_subscribers: true },
  })
  if (!creator) return

  const size = computeCreatorSize(creator.subs_followers ?? null, creator.youtube_subscribers ?? null)
  await prisma.content_creators.update({
    where: { clerk_user_id: userId },
    data: { creator_size: size ?? undefined },
  })
}

export const twitchSyncer: CreatorPlatformSyncer = {
  platform: 'twitch',
  isConfigured: () => true,
  read: (creator) =>
    creator.twitch_id ? { accountId: creator.twitch_id, syncedAt: creator.twitch_synced_at } : null,
  async sync({ userId, accountId, creator }) {
    // VOD lookback: 60 days for partners (VODs live longer), 14 days otherwise.
    const lookbackDays = creator.twitch_broadcaster_type === 'partner' ? 60 : 14

    const [twitchUser, followerCount, streamStats] = await Promise.all([
      getTwitchUserById(accountId),
      getTwitchFollowerCount(accountId),
      getTwitchStreamStats(accountId, lookbackDays),
    ])
    if (!twitchUser) return false

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        twitch_username: twitchUser.login,
        twitch_broadcaster_type: twitchUser.broadcaster_type,
        twitch_description: twitchUser.description,
        twitch_profile_image: twitchUser.profile_image_url,
        twitch_synced_at: new Date(),
        subs_followers: followerCount,
        average_vod_views: streamStats.average_vod_views,
      },
    })
    return true
  },
}

/**
 * Returns a valid YouTube access token, refreshing it via the stored refresh token
 * (and persisting the new token) when expired. Returns null if no usable token exists.
 */
async function getValidYouTubeAccessToken(
  encryptedAccess: string | null,
  encryptedRefresh: string | null,
  expiresAt: Date | null,
  userId: string,
): Promise<string | null> {
  if (!encryptedAccess || !encryptedRefresh) return null

  const isExpired = !expiresAt || expiresAt <= new Date()
  if (!isExpired) return decryptToken(encryptedAccess)

  const refreshToken = decryptToken(encryptedRefresh)
  if (!refreshToken) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null

  const data = await res.json()
  const newAccessToken: string = data.access_token
  const newExpiresIn: number = data.expires_in ?? 3600

  await prisma.content_creators.update({
    where: { clerk_user_id: userId },
    data: {
      youtube_access_token: encryptToken(newAccessToken),
      youtube_token_expires_at: new Date(Date.now() + newExpiresIn * 1000),
    },
  })
  return newAccessToken
}

export const youtubeSyncer: CreatorPlatformSyncer = {
  platform: 'youtube',
  isConfigured: () => Boolean(process.env.YOUTUBE_API_KEY),
  read: (creator) =>
    creator.youtube_channel_id
      ? { accountId: creator.youtube_channel_id, syncedAt: creator.youtube_synced_at }
      : null,
  async sync({ userId, accountId, creator }) {
    const [channel, stats] = await Promise.all([
      getYouTubeChannelById(accountId),
      getYouTubeChannelStats(accountId),
    ])
    if (!channel) return false

    // OAuth-gated enrichment: 30-day watch time + channel member count. Optional —
    // absent when the creator has no stored token or the token can't be refreshed.
    let watchTimeHours: number | null = null
    let memberCount: number | null = null
    const accessToken = await getValidYouTubeAccessToken(
      creator.youtube_access_token,
      creator.youtube_refresh_token,
      creator.youtube_token_expires_at,
      userId,
    )
    if (accessToken) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]

      const [analyticsRes, membersRes] = await Promise.all([
        fetch(
          `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${accountId}&startDate=${thirtyDaysAgo}&endDate=${today}&metrics=estimatedMinutesWatched&dimensions=day`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
        fetch(
          'https://www.googleapis.com/youtube/v3/members?part=snippet&mode=listMembers&maxResults=1',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      ])

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        const rows: number[][] = analyticsData.rows ?? []
        const totalMinutes = rows.reduce((sum, row) => sum + (row[1] ?? 0), 0)
        watchTimeHours = Math.round(totalMinutes / 60)
      }
      if (membersRes.ok) {
        const membersData = await membersRes.json()
        if (typeof membersData.pageInfo?.totalResults === 'number') {
          memberCount = membersData.pageInfo.totalResults
        }
      }
    }

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        youtube_channel_name: channel.title,
        youtube_handle: channel.handle,
        youtube_subscribers: channel.subscriber_count,
        youtube_avg_views: stats.avg_views || null,
        youtube_top_categories: stats.top_categories,
        youtube_synced_at: new Date(),
        ...(watchTimeHours !== null ? { youtube_watch_time_hours: watchTimeHours } : {}),
        ...(memberCount !== null ? { youtube_member_count: memberCount } : {}),
      },
    })
    return true
  },
}
