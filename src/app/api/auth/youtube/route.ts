import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

// Scopes needed:
// youtube.readonly       — channel info, video stats
// yt-analytics.readonly  — watch time, demographics
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
].join(' ')

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