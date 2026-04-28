/**
 * @file api/steam/lookup/route.ts
 *
 * Server-side Steam profile lookup endpoint. Used by the sponsor/admin Steam
 * search tool to fetch public Steam data for any SteamID, vanity URL, or
 * profile URL.
 *
 * Auth: Restricted to signed-in users with role 'sponsor' or 'admin'. The
 * existing `proxy.ts` middleware already requires sign-in for all non-public
 * routes, but role gating is enforced explicitly here as defense in depth.
 *
 * Request:
 *   GET /api/steam/lookup?q=<input>
 *   where <input> is a SteamID64, vanity name, or steamcommunity.com URL.
 *
 * Response (200):
 *   { profile, allGames, recentGames }
 * Response (4xx/5xx):
 *   { error: string }
 *
 * Security notes:
 *   - `STEAM_API_KEY` is read on the server only and never returned to the
 *     client.
 *   - Failures from the Steam API are surfaced as generic 502 errors rather
 *     than leaking internals.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  resolveSteamInput,
  getPlayerSummary,
  getOwnedGames,
  getRecentlyPlayedGames,
} from '@/lib/steam'

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = (user.publicMetadata?.role as string) ?? null
  if (role !== 'sponsor' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  // ── Input ────────────────────────────────────────────────────────────────
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing search input.' }, { status: 400 })
  }

  // ── Resolve & fetch ──────────────────────────────────────────────────────
  let steamId: string
  try {
    const resolved = await resolveSteamInput(q)
    steamId = resolved.steamId
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Could not resolve Steam profile.' },
      { status: 404 },
    )
  }

  try {
    const [profile, allGames, recentGames] = await Promise.all([
      getPlayerSummary(steamId),
      getOwnedGames(steamId),
      getRecentlyPlayedGames(steamId),
    ])

    if (!profile) {
      return NextResponse.json(
        { error: 'No Steam profile found for that ID.' },
        { status: 404 },
      )
    }

    // Sort all owned games by total playtime, descending.
    const sortedAllGames = [...allGames].sort(
      (a, b) => b.playtimeMinutes - a.playtimeMinutes,
    )
    // Recent games sorted by 2-week playtime, descending.
    const sortedRecent = [...recentGames].sort(
      (a, b) => b.playtime2WeeksMinutes - a.playtime2WeeksMinutes,
    )

    return NextResponse.json({
      profile,
      allGames: sortedAllGames,
      recentGames: sortedRecent,
    })
  } catch (err) {
    console.error('[steam/lookup] fetch failed:', err)
    return NextResponse.json(
      { error: 'Failed to fetch Steam data.' },
      { status: 502 },
    )
  }
}