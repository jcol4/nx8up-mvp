/**
 * GET /api/auth/steam/callback
 *
 * Handles the OpenID 2.0 redirect from Steam after the user logs in.
 *
 * Flow:
 *   1. Receives Steam's response as URL query parameters.
 *   2. Verifies the response by sending it back to Steam with
 *      `openid.mode=check_authentication`. This is the critical
 *      anti-impersonation step — Steam re-validates its own signature.
 *   3. Extracts the verified SteamID64 from the response.
 *   4. Fetches the user's profile summary, owned games, and recently
 *      played games from the Steam Web API.
 *   5. Saves everything to the creator's `content_creators` row in DB.
 *   6. Redirects back to /creator/profile with success or error params.
 *
 * Required env vars: STEAM_API_KEY, NEXT_PUBLIC_APP_URL
 *
 * Security: The `verifySteamOpenId` step is non-negotiable. Without it,
 * any visitor could craft a fake redirect URL and claim to own any Steam
 * account. The function does both signature verification (via Steam) and
 * SteamID64 format validation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  verifySteamOpenId,
  getPlayerSummary,
  getOwnedGames,
  getRecentlyPlayedGames,
} from '@/lib/steam'

/** Returns absolute URL to /creator/profile with the given query params. */
function profileRedirect(params: Record<string, string>) {
  const url = new URL('/creator/profile', process.env.NEXT_PUBLIC_APP_URL!)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL!))
  }

  // 1. Verify the OpenID response with Steam.
  const steamId = await verifySteamOpenId(req.nextUrl.searchParams)
  if (!steamId) {
    return profileRedirect({
      steam_error: encodeURIComponent('Steam authentication failed. Please try again.'),
    })
  }

  // 2. Fetch profile + game data in parallel.
  let profile: Awaited<ReturnType<typeof getPlayerSummary>>
  let owned: Awaited<ReturnType<typeof getOwnedGames>>
  let recent: Awaited<ReturnType<typeof getRecentlyPlayedGames>>
  try {
    [profile, owned, recent] = await Promise.all([
      getPlayerSummary(steamId),
      getOwnedGames(steamId),
      getRecentlyPlayedGames(steamId),
    ])
  } catch (err) {
    console.error('[steam callback] data fetch failed:', err)
    return profileRedirect({
      steam_error: encodeURIComponent('Could not fetch Steam profile data.'),
    })
  }

  if (!profile) {
    return profileRedirect({
      steam_error: encodeURIComponent('No public Steam profile found.'),
    })
  }

  // 3. Pick top 5 most-played games and last 5 recent games.
  const topGames = [...owned]
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
    .slice(0, 5)
    .map((g) => ({
      appId: g.appId,
      name: g.name,
      hoursTotal: Math.round((g.playtimeMinutes / 60) * 10) / 10,
      iconUrl: g.iconUrl,
    }))

  const recentGames = [...recent]
    .sort((a, b) => b.playtime2WeeksMinutes - a.playtime2WeeksMinutes)
    .slice(0, 5)
    .map((g) => ({
      appId: g.appId,
      name: g.name,
      hoursRecent: Math.round((g.playtime2WeeksMinutes / 60) * 10) / 10,
      iconUrl: g.iconUrl,
    }))

  // 4. Save to the creator's row. Uses `upsert` semantics — we update fields
  // on the existing creator. If the SteamID is already linked to a different
  // creator, the @unique constraint on steam_id will reject the update.
  try {
    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        steam_id: steamId,
        steam_username: profile.personaName,
        steam_profile_url: profile.profileUrl,
        steam_avatar_url: profile.avatarUrl,
        steam_profile_visibility: profile.communityVisibilityState,
        steam_top_games: topGames,
        steam_recent_games: recentGames,
        steam_synced_at: new Date(),
      },
    })
  } catch (err: any) {
    // Most likely cause: another creator has already linked this SteamID
    // (P2002 = unique constraint violation on steam_id).
    if (err?.code === 'P2002') {
      return profileRedirect({
        steam_error: encodeURIComponent('This Steam account is already linked to another creator.'),
      })
    }
    console.error('[steam callback] DB save failed:', err)
    return profileRedirect({
      steam_error: encodeURIComponent('Failed to save Steam connection.'),
    })
  }

  return profileRedirect({ steam_linked: '1' })
}