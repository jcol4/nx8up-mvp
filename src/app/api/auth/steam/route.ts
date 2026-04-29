/**
 * GET /api/auth/steam
 *
 * Initiates Steam OpenID 2.0 authentication.
 * Generates a CSRF nonce, stores it in a short-lived HttpOnly cookie,
 * then redirects the user to Steam's login page.
 *
 * Steam OpenID does not require an API key — it uses the OpenID 2.0 protocol.
 * Required env vars: NEXT_PUBLIC_APP_URL
 *
 * On success: redirects to Steam login.
 * On failure: redirects to /creator/profile?steam_error=<reason>
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(`${APP_URL}/sign-in`)
  }

  // Generate a nonce to prevent CSRF / replay attacks
  const nonce = randomBytes(16).toString('hex')

  const cookieStore = await cookies()
  cookieStore.set('steam_openid_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  const returnTo = `${APP_URL}/api/auth/steam/callback?nonce=${nonce}`

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': APP_URL,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  return NextResponse.redirect(`${STEAM_OPENID_URL}?${params.toString()}`)
}