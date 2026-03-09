// App token is cached in memory and refreshed when expired

interface AppToken {
  access_token: string
  expires_at: number
}

interface TwitchUser {
  id: string
  login: string
  display_name: string
  broadcaster_type: string
  description: string
  profile_image_url: string
  created_at: string
}

let cachedToken: AppToken | null = null

async function getAppToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token
  }

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to get Twitch app token: ${res.status}`)
  }

  const data = await res.json()

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.access_token
}

export async function getTwitchUserByLogin(username: string): Promise<TwitchUser | null> {
  const token = await getAppToken()

  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username.toLowerCase().trim())}`,
    {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 0 }, // never cache — we handle caching in Supabase
    }
  )

  if (!res.ok) {
    throw new Error(`Twitch API error: ${res.status}`)
  }

  const data = await res.json()
  return data.data?.[0] ?? null
}

export async function getTwitchUserById(id: string): Promise<TwitchUser | null> {
  const token = await getAppToken()

  const res = await fetch(
    `https://api.twitch.tv/helix/users?id=${encodeURIComponent(id)}`,
    {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) {
    throw new Error(`Twitch API error: ${res.status}`)
  }

  const data = await res.json()
  return data.data?.[0] ?? null
}

// Checks if cached data is stale (older than threshold in hours)
export function isTwitchDataStale(syncedAt: Date | null, thresholdHours = 24): boolean {
  if (!syncedAt) return true
  const ageMs = Date.now() - new Date(syncedAt).getTime()
  return ageMs > thresholdHours * 60 * 60 * 1000
}