/**
 * GET /api/auth/youtube
 *
 * Initiates the Google/YouTube OAuth 2.0 authorization code flow.
 * Generates a CSRF state token, stores it in a 10-minute HttpOnly cookie,
 * then redirects to Google's consent screen.
 *
 * `access_type=offline` and `prompt=consent` are required to always receive
 * a refresh token — without them Google only issues one on first authorization.
 *
 * Required env vars: GOOGLE_CLIENT_ID, YOUTUBE_REDIRECT_URI
 * On success: redirects to Google authorization URL.
 * On failure: redirects to /sign-in or returns 500.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

// Scopes needed:
// youtube.readonly                    — channel info, video stats
// yt-analytics.readonly               — watch time, demographics
// youtube.channel-memberships.creator — paying channel member count
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtube.channel-memberships.creator',
].join(' ')

/** Redirects authenticated users to Google's OAuth consent screen for YouTube access. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error('Missing GOOGLE_CLIENT_ID or YOUTUBE_REDIRECT_URI')
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 })
  }

  // Generate CSRF state
  const state = randomBytes(16).toString('hex')

  const cookieStore = await cookies()
  cookieStore.set('youtube_oauth_state', state, {
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
    access_type: 'offline',   // Required to get refresh token
    prompt: 'consent',        // Force consent screen so refresh token is always returned
  })

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`)
}