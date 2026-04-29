/**
 * GET /api/auth/steam
 *
 * Initiates the Steam OpenID 2.0 authentication flow.
 * Redirects the user to Steam's OpenID endpoint with our return-to URL.
 *
 * Steam OpenID is stateless from our side: the only thing that comes back
 * is a SteamID. There are no tokens, scopes, or refresh logic — the user
 * simply proves to Steam that they own a given account, and Steam tells us.
 *
 * Required env vars: NEXT_PUBLIC_APP_URL
 * On success: redirects to Steam's OpenID consent screen.
 * On failure: redirects to /sign-in or returns 500.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSteamLoginUrl } from '@/lib/steam'

/** Redirects authenticated users to Steam's OpenID consent screen. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    console.error('Missing NEXT_PUBLIC_APP_URL')
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 })
  }

  const returnTo = new URL('/api/auth/steam/callback', appUrl).toString()
  const loginUrl = getSteamLoginUrl(returnTo)
  return NextResponse.redirect(loginUrl)
}