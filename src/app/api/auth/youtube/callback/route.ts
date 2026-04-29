/**
 * GET /api/auth/youtube/callback
 *
 * Handles the Google OAuth callback after the user grants YouTube access.
 * Steps:
 *  1. Validates CSRF state against the cookie set by /api/auth/youtube
 *  2. Exchanges the authorization code for access + refresh tokens
 *  3. Fetches channel info, recent video stats, member count, and watch time
 *  4. Encrypts tokens with AES-256-GCM before storing
 *  5. Upserts the content_creators row for the authenticated Clerk user
 *  6. Kicks off an async aggregate CTR recompute (no await — non-blocking)
 *
 * On success: redirects to /creator/profile?youtube_linked=1
 * On any error: redirects to /creator/profile?youtube_error=<reason>
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { encryptToken } from '@/lib/token-encryption'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3'
const YT_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

/** YouTube category ID → readable name mapping (gaming-relevant subset). */
const CATEGORY_MAP: Record<string, string> = {
  '1': 'Film & Animation', '2': 'Autos & Vehicles', '10': 'Music',
  '15': 'Pets & Animals', '17': 'Sports', '18': 'Short Movies',
  '19': 'Travel & Events', '20': 'Gaming', '21': 'Videoblogging',
  '22': 'People & Blogs', '23': 'Comedy', '24': 'Entertainment',
  '25': 'News & Politics', '26': 'Howto & Style', '27': 'Education',
  '28': 'Science & Technology', '29': 'Nonprofits & Activism',
}

/** Redirects to the creator profile page with a ?youtube_error query param for toast display. */
function redirectWithError(reason: string) {
  return NextResponse.redirect(`${APP_URL}/creator/profile?youtube_error=${encodeURIComponent(reason)}`)
}

/** Receives the Google OAuth callback, exchanges the code, and persists YouTube credentials. */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(`${APP_URL}/sign-in`)

  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return redirectWithError('YouTube authorization was denied.')
  }

  if (!code || !state) {
    return redirectWithError('Invalid callback parameters.')
  }

  // Validate state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('youtube_oauth_state')?.value
  cookieStore.delete('youtube_oauth_state')

  if (!savedState || savedState !== state) {
    return redirectWithError('State mismatch. Please try again.')
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI!

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    console.error('Google token exchange failed:', await tokenRes.text())
    return redirectWithError('Failed to exchange authorization code.')
  }

  const tokenData = await tokenRes.json()
  const accessToken: string = tokenData.access_token
  const refreshToken: string | undefined = tokenData.refresh_token
  const expiresIn: number = tokenData.expires_in // seconds (~3600)

  if (!refreshToken) {
    // This happens if prompt=consent was ignored or user already authorized before
    return redirectWithError('No refresh token returned. Please revoke NX8UP access in your Google account and try again.')
  }

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

  // Fetch the user's YouTube channel
  const channelRes = await fetch(
    `${YT_API_BASE}/channels?part=snippet,statistics,contentDetails&mine=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!channelRes.ok) {
    console.error('YouTube channel fetch failed:', await channelRes.text())
    return redirectWithError('Failed to fetch YouTube channel data.')
  }

  const channelData = await channelRes.json()
  const channel = channelData.items?.[0]

  if (!channel) {
    return redirectWithError('No YouTube channel found on this Google account.')
  }

  const channelId: string = channel.id
  const channelName: string = channel.snippet?.title ?? ''
  const handle: string = channel.snippet?.customUrl ?? ''
  const subscribers: number = parseInt(channel.statistics?.subscriberCount ?? '0')
  const uploadsPlaylistId: string = channel.contentDetails?.relatedPlaylists?.uploads ?? ''

  // Check this channel isn't already linked to another creator
  const existingLink = await prisma.content_creators.findFirst({
    where: {
      youtube_channel_id: channelId,
      NOT: { clerk_user_id: userId },
    },
  })

  if (existingLink) {
    return redirectWithError('This YouTube channel is already linked to another NX8UP profile.')
  }

  // Fetch recent videos to calculate avg views and top categories
  let avgViews: number | null = null
  let topCategories: string[] = []

  if (uploadsPlaylistId) {
    const playlistRes = await fetch(
      `${YT_API_BASE}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (playlistRes.ok) {
      const playlistData = await playlistRes.json()
      const videoIds: string[] = (playlistData.items ?? [])
        .map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId)
        .filter(Boolean)

      if (videoIds.length > 0) {
        const videosRes = await fetch(
          `${YT_API_BASE}/videos?part=statistics,snippet&id=${videoIds.join(',')}&maxResults=50`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        if (videosRes.ok) {
          const videosData = await videosRes.json()
          const videos: {
            statistics?: { viewCount?: string }
            snippet?: { categoryId?: string }
          }[] = videosData.items ?? []

          if (videos.length > 0) {
            const totalViews = videos.reduce(
              (sum, v) => sum + parseInt(v.statistics?.viewCount ?? '0'),
              0
            )
            avgViews = Math.round(totalViews / videos.length)

            // Tally category IDs
            const catCount: Record<string, number> = {}
            for (const v of videos) {
              const cat = v.snippet?.categoryId
              if (cat) catCount[cat] = (catCount[cat] ?? 0) + 1
            }
            topCategories = Object.entries(catCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([id]) => CATEGORY_MAP[id] ?? `Category ${id}`)
          }
        }
      }
    }
  }

  // Fetch paying channel member count (requires channel-memberships.creator scope)
  // Returns null if memberships are not enabled on this channel
  let memberCount: number | null = null
  const membersRes = await fetch(
    `${YT_API_BASE}/members?part=snippet&mode=listMembers&maxResults=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (membersRes.ok) {
    const membersData = await membersRes.json()
    if (typeof membersData.pageInfo?.totalResults === 'number') {
      memberCount = membersData.pageInfo.totalResults
    }
  }
  // 403 with channelMembershipsNotEnabled is expected for channels without memberships — leave null

  // Fetch watch time from YouTube Analytics API
  let watchTimeHours: number | null = null
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const analyticsRes = await fetch(
    `${YT_ANALYTICS_BASE}/reports?ids=channel==${channelId}&startDate=${thirtyDaysAgo}&endDate=${today}&metrics=estimatedMinutesWatched&dimensions=day`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (analyticsRes.ok) {
    const analyticsData = await analyticsRes.json()
    const rows: number[][] = analyticsData.rows ?? []
    if (rows.length > 0) {
      const totalMinutes = rows.reduce((sum, row) => sum + (row[1] ?? 0), 0)
      watchTimeHours = Math.round(totalMinutes / 60)
    }
  }

  // Encrypt tokens
  const encryptedAccess = encryptToken(accessToken)
  const encryptedRefresh = encryptToken(refreshToken)

  // Upsert creator record
  await prisma.content_creators.upsert({
    where: { clerk_user_id: userId },
    create: {
      clerk_user_id: userId,
      email: '',
      youtube_channel_id: channelId,
      youtube_channel_name: channelName,
      youtube_handle: handle.replace(/^@/, ''),
      youtube_subscribers: subscribers,
      youtube_avg_views: avgViews,
      youtube_top_categories: topCategories,
      youtube_watch_time_hours: watchTimeHours,
      youtube_member_count: memberCount,
      youtube_synced_at: new Date(),
      youtube_access_token: encryptedAccess,
      youtube_refresh_token: encryptedRefresh,
      youtube_token_expires_at: tokenExpiresAt,
      language: [],
      platform: [],
      content_type: [],
      game_category: [],
      audience_locations: [],
      creator_types: [],
      content_style: [],
      audience_interests: [],
      preferred_campaign_types: [],
      preferred_product_types: [],
      audience_gender: [],
    },
    update: {
      youtube_channel_id: channelId,
      youtube_channel_name: channelName,
      youtube_handle: handle.replace(/^@/, ''),
      youtube_subscribers: subscribers,
      youtube_avg_views: avgViews,
      youtube_top_categories: topCategories,
      youtube_watch_time_hours: watchTimeHours,
      youtube_member_count: memberCount,
      youtube_synced_at: new Date(),
      youtube_access_token: encryptedAccess,
      youtube_refresh_token: encryptedRefresh,
      youtube_token_expires_at: tokenExpiresAt,
      updated_at: new Date(),
    },
  })

  // Refresh aggregate CTR from already-stored per-submission CTRs (DB-only, no extra API calls)
  const { recomputeCreatorAggregateCtr } = await import('@/lib/ctr')
  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (creator) {
    recomputeCreatorAggregateCtr(creator.id).catch(console.error)
  }

  return NextResponse.redirect(`${APP_URL}/creator/profile?youtube_linked=1`)
}