/**
 * GET /api/auth/steam/callback
 *
 * Handles the Steam OpenID 2.0 callback after the user authenticates on Steam.
 * Steps:
 *  1. Validates the nonce cookie to prevent CSRF
 *  2. Verifies the OpenID assertion with Steam (check_authentication)
 *  3. Extracts the SteamID64 from the claimed identity URL
 *  4. Fetches the public profile + games via Steam Web API
 *  5. Checks the SteamID isn't already linked to another account
 *  6. Upserts steam_* fields on the content_creators row
 *
 * On success: redirects to /creator/profile?steam_linked=1
 * On any error: redirects to /creator/profile?steam_error=<reason>
 *
 * Required env vars: STEAM_API_KEY, NEXT_PUBLIC_APP_URL
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { validateCsrfCookie } from '@/lib/oauth-callback-utils'
import { Prisma } from '@prisma/client'
import { getPlayerSummary, getOwnedGames, getRecentlyPlayedGames } from '@/lib/steam'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

function redirectWithError(reason: string) {
  return NextResponse.redirect(
    `${APP_URL}/creator/profile?steam_error=${encodeURIComponent(reason)}`
  )
}

/**
 * Sends a check_authentication request back to Steam to verify
 * the OpenID assertion is genuine. Returns true if Steam confirms it.
 */
async function verifyOpenIdAssertion(params: URLSearchParams): Promise<boolean> {
  const verifyParams = new URLSearchParams(params)
  verifyParams.set('openid.mode', 'check_authentication')

  const res = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  })

  if (!res.ok) return false
  const text = await res.text()
  return text.includes('is_valid:true')
}

/**
 * Extracts the SteamID64 from the claimed_id URL.
 * Steam returns: https://steamcommunity.com/openid/id/76561198012345678
 */
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/\/openid\/id\/(\d+)$/)
  return match ? match[1] : null
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(`${APP_URL}/sign-in`)

  const { searchParams } = req.nextUrl

  const nonce = searchParams.get('nonce')
  if (!await validateCsrfCookie('steam_openid_nonce', nonce)) {
    return redirectWithError('Invalid session. Please try again.')
  }

  // Check Steam didn't return an error or cancellation
  const mode = searchParams.get('openid.mode')
  if (mode === 'cancel') {
    return redirectWithError('Steam authentication was cancelled.')
  }
  if (mode !== 'id_res') {
    return redirectWithError('Unexpected response from Steam.')
  }

  // Verify the assertion with Steam
  const isValid = await verifyOpenIdAssertion(searchParams)
  if (!isValid) {
    return redirectWithError('Could not verify Steam identity. Please try again.')
  }

  // Extract SteamID64 from claimed_id
  const claimedId = searchParams.get('openid.claimed_id') ?? ''
  const steamId = extractSteamId(claimedId)
  if (!steamId) {
    return redirectWithError('Could not extract Steam ID from response.')
  }

  // Fetch Steam profile
  const profile = await getPlayerSummary(steamId)
  if (!profile) {
    return redirectWithError('Could not fetch Steam profile. Make sure your profile is public.')
  }

  // Check this Steam account isn't already linked to another creator
  const existingLink = await prisma.content_creators.findFirst({
    where: {
      steam_id: steamId,
      NOT: { clerk_user_id: userId },
    },
  })
  if (existingLink) {
    return redirectWithError('This Steam account is already linked to another NX8UP profile.')
  }

  // Fetch top games and recent games (best-effort — don't fail auth if private)
  let topGames = null
  let recentGames = null
  try {
    const [owned, recent] = await Promise.all([
      getOwnedGames(steamId),
      getRecentlyPlayedGames(steamId),
    ])
    // Store top 20 by playtime
    topGames = owned
      .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
      .slice(0, 20)
    recentGames = recent.slice(0, 10)
  } catch {
    // Games are private or API error — that's fine, profile is still linked
  }

  // Upsert steam fields onto the creator record
  await prisma.content_creators.upsert({
    where: { clerk_user_id: userId },
    create: {
      clerk_user_id: userId,
      email: '',
      steam_id: steamId,
      steam_username: profile.personaName,
      steam_profile_url: profile.profileUrl,
      steam_avatar_url: profile.avatarUrl,
      steam_profile_visibility: profile.communityVisibilityState,
      steam_top_games: (topGames ?? undefined) as Prisma.InputJsonValue | undefined,
      steam_recent_games: (recentGames ?? undefined) as Prisma.InputJsonValue | undefined,
      steam_synced_at: new Date(),
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
      steam_id: steamId,
      steam_username: profile.personaName,
      steam_profile_url: profile.profileUrl,
      steam_avatar_url: profile.avatarUrl,
      steam_profile_visibility: profile.communityVisibilityState,
      steam_top_games: (topGames ?? undefined) as Prisma.InputJsonValue | undefined,
      steam_recent_games: (recentGames ?? undefined) as Prisma.InputJsonValue | undefined,
      steam_synced_at: new Date(),
      updated_at: new Date(),
    },
  })

  return NextResponse.redirect(`${APP_URL}/creator/profile?steam_linked=1`)
}