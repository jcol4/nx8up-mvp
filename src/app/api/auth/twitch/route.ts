import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize'

// Scopes needed:
// user:read:email        — confirm account identity
// channel:read:subscriptions — paid subscriber count (requires user token)
const SCOPES = ['user:read:email', 'channel:read:subscriptions'].join(' ')

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const clientId = process.env.TWITCH_CLIENT_ID
  const redirectUri = process.env.TWITCH_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error('Missing TWITCH_CLIENT_ID or TWITCH_REDIRECT_URI')
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 })
  }

  // Generate a random state to prevent CSRF
  const state = randomBytes(16).toString('hex')

  // Store state in a short-lived HttpOnly cookie
  const cookieStore = await cookies()
  cookieStore.set('twitch_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
    force_verify: 'true', // Always show the auth screen so user can confirm account
  })

  return NextResponse.redirect(`${TWITCH_AUTH_URL}?${params.toString()}`)
}