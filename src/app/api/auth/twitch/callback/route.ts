/**
 * GET /api/auth/twitch/callback
 *
 * Handles the Twitch OAuth callback after the user grants access.
 * Steps:
 *  1. Validates CSRF state against the cookie set by /api/auth/twitch
 *  2. Exchanges the authorization code for access + refresh tokens
 *  3. Fetches the Twitch user, follower count, subscriber count, and recent VODs
 *  4. Encrypts tokens with AES-256-GCM before storing
 *  5. Upserts the content_creators row for the authenticated Clerk user
 *  6. Kicks off an async aggregate CTR recompute (no await — non-blocking)
 *
 * On success: redirects to /creator/profile?twitch_linked=1
 * On any error: redirects to /creator/profile?twitch_error=<reason>
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { encryptToken } from '@/lib/token-encryption'

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const TWITCH_API_BASE = 'https://api.twitch.tv/helix'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

/** Redirects to the creator profile page with a ?twitch_error query param for toast display. */
function redirectWithError(reason: string) {
  return NextResponse.redirect(`${APP_URL}/creator/profile?twitch_error=${encodeURIComponent(reason)}`)
}

/** Receives the Twitch OAuth callback, exchanges the code, and persists credentials. */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(`${APP_URL}/sign-in`)

  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // User denied access on Twitch
  if (error) {
    return redirectWithError('Twitch authorization was denied.')
  }

  if (!code || !state) {
    return redirectWithError('Invalid callback parameters.')
  }

  // Validate state against cookie
  const cookieStore = await cookies()
  const savedState = cookieStore.get('twitch_oauth_state')?.value
  cookieStore.delete('twitch_oauth_state')

  if (!savedState || savedState !== state) {
    return redirectWithError('State mismatch. Please try again.')
  }

  const clientId = process.env.TWITCH_CLIENT_ID!
  const clientSecret = process.env.TWITCH_CLIENT_SECRET!
  const redirectUri = process.env.TWITCH_REDIRECT_URI!

  // Exchange code for tokens
  const tokenRes = await fetch(TWITCH_TOKEN_URL, {
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
    console.error('Twitch token exchange failed:', await tokenRes.text())
    return redirectWithError('Failed to exchange authorization code.')
  }

  const tokenData = await tokenRes.json()
  const accessToken: string = tokenData.access_token
  const refreshToken: string = tokenData.refresh_token
  const expiresIn: number = tokenData.expires_in // seconds

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000)

  // Fetch the Twitch user using the access token
  const userRes = await fetch(`${TWITCH_API_BASE}/users`, {
    headers: {
      'Client-Id': clientId,
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!userRes.ok) {
    console.error('Twitch user fetch failed:', await userRes.text())
    return redirectWithError('Failed to fetch Twitch user data.')
  }

  const userData = await userRes.json()
  const twitchUser = userData.data?.[0]

  if (!twitchUser) {
    return redirectWithError('No Twitch user data returned.')
  }

  // Check this Twitch account isn't already linked to another creator
  const existingLink = await prisma.content_creators.findFirst({
    where: {
      twitch_id: twitchUser.id,
      NOT: { clerk_user_id: userId },
    },
  })

  if (existingLink) {
    return redirectWithError('This Twitch account is already linked to another NX8UP profile.')
  }

  // Fetch follower count
  let followersCount = 0
  const followersRes = await fetch(
    `${TWITCH_API_BASE}/channels/followers?broadcaster_id=${twitchUser.id}`,
    {
      headers: {
        'Client-Id': clientId,
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )
  if (followersRes.ok) {
    const followersData = await followersRes.json()
    followersCount = followersData.total ?? 0
  }

  // Fetch subscriber count (requires user token with channel:read:subscriptions)
  let subscriberCount: number | null = null
  const subsRes = await fetch(
    `${TWITCH_API_BASE}/subscriptions?broadcaster_id=${twitchUser.id}`,
    {
      headers: {
        'Client-Id': clientId,
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )
  if (subsRes.ok) {
    const subsData = await subsRes.json()
    subscriberCount = subsData.total ?? null
  }

  // Fetch recent VODs for avg view calculation
  let averageVodViews: number | null = null
  const vodsRes = await fetch(
    `${TWITCH_API_BASE}/videos?user_id=${twitchUser.id}&type=archive&first=20`,
    {
      headers: {
        'Client-Id': clientId,
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )
  if (vodsRes.ok) {
    const vodsData = await vodsRes.json()
    const vods: { view_count: number }[] = vodsData.data ?? []
    if (vods.length > 0) {
      const total = vods.reduce((sum, v) => sum + (v.view_count ?? 0), 0)
      averageVodViews = Math.round(total / vods.length)
    }
  }

  // Encrypt tokens before storing
  const encryptedAccess = encryptToken(accessToken)
  const encryptedRefresh = encryptToken(refreshToken)

  // Upsert the creator record
  await prisma.content_creators.upsert({
    where: { clerk_user_id: userId },
    create: {
      clerk_user_id: userId,
      email: twitchUser.email ?? '',
      twitch_id: twitchUser.id,
      twitch_username: twitchUser.login,
      twitch_broadcaster_type: twitchUser.broadcaster_type || 'none',
      twitch_description: twitchUser.description,
      twitch_profile_image: twitchUser.profile_image_url,
      twitch_created_at: new Date(twitchUser.created_at),
      twitch_synced_at: new Date(),
      twitch_access_token: encryptedAccess,
      twitch_refresh_token: encryptedRefresh,
      twitch_token_expires_at: tokenExpiresAt,
      subs_followers: followersCount,
      twitch_subscriber_count: subscriberCount,
      average_vod_views: averageVodViews,
      language: [],
      platform: [],
      content_type: [],
      game_category: [],
      youtube_top_categories: [],
      audience_locations: [],
      creator_types: [],
      content_style: [],
      audience_interests: [],
      preferred_campaign_types: [],
      preferred_product_types: [],
      audience_gender: [],
    },
    update: {
      twitch_id: twitchUser.id,
      twitch_username: twitchUser.login,
      twitch_broadcaster_type: twitchUser.broadcaster_type || 'none',
      twitch_description: twitchUser.description,
      twitch_profile_image: twitchUser.profile_image_url,
      twitch_created_at: new Date(twitchUser.created_at),
      twitch_synced_at: new Date(),
      twitch_access_token: encryptedAccess,
      twitch_refresh_token: encryptedRefresh,
      twitch_token_expires_at: tokenExpiresAt,
      subs_followers: followersCount,
      twitch_subscriber_count: subscriberCount,
      average_vod_views: averageVodViews,
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

  return NextResponse.redirect(`${APP_URL}/creator/profile?twitch_linked=1`)
}