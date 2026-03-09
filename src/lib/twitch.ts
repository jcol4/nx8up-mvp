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

interface TwitchVideo {
  id: string
  user_id: string
  title: string
  duration: string   // e.g. "3h8m33s"
  view_count: number
  created_at: string
  game_id: string
}

let cachedToken: AppToken | null = null

async function getAppToken(): Promise<string> {
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

  if (!res.ok) throw new Error(`Failed to get Twitch app token: ${res.status}`)

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
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) throw new Error(`Twitch API error: ${res.status}`)
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

  if (!res.ok) throw new Error(`Twitch API error: ${res.status}`)
  const data = await res.json()
  return data.data?.[0] ?? null
}

// Returns total follower count for a broadcaster
// GET /helix/channels/followers — app access token only
export async function getTwitchFollowerCount(broadcasterId: string): Promise<number> {
  const token = await getAppToken()
  const res = await fetch(
    `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${encodeURIComponent(broadcasterId)}&first=1`,
    {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) throw new Error(`Twitch followers API error: ${res.status}`)
  const data = await res.json()
  return data.total ?? 0
}

// Parses Twitch duration string (e.g. "3h8m33s") into total seconds
function parseDuration(duration: string): number {
  const hours = parseInt(duration.match(/(\d+)h/)?.[1] ?? '0')
  const minutes = parseInt(duration.match(/(\d+)m/)?.[1] ?? '0')
  const seconds = parseInt(duration.match(/(\d+)s/)?.[1] ?? '0')
  return hours * 3600 + minutes * 60 + seconds
}

// Resolves Twitch game IDs to names via /helix/games
async function resolveGameNames(gameIds: string[], token: string): Promise<string[]> {
  if (gameIds.length === 0) return []

  const params = gameIds.map((id) => `id=${encodeURIComponent(id)}`).join('&')
  const res = await fetch(`https://api.twitch.tv/helix/games?${params}`, {
    headers: {
      'Client-Id': process.env.TWITCH_CLIENT_ID!,
      'Authorization': `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) return gameIds // fall back to IDs if name lookup fails

  const data = await res.json()
  const nameMap: Record<string, string> = {}
  for (const game of data.data ?? []) {
    nameMap[game.id] = game.name
  }

  return gameIds.map((id) => nameMap[id] ?? id)
}

// Fetches VODs and computes average_viewers and most_played_games
// GET /helix/videos — app access token only
// VODs expire (14 days non-partner, 60 days partner) — compute derived metrics immediately
export async function getTwitchStreamStats(
  userId: string,
  lookbackDays = 28
): Promise<{ average_viewers: number; most_played_games: string[] }> {
  const token = await getAppToken()

  const res = await fetch(
    `https://api.twitch.tv/helix/videos?user_id=${encodeURIComponent(userId)}&type=archive&first=100`,
    {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) throw new Error(`Twitch videos API error: ${res.status}`)
  const data = await res.json()
  const videos: TwitchVideo[] = data.data ?? []

  if (videos.length === 0) {
    return { average_viewers: 0, most_played_games: [] }
  }

  // Filter to rolling lookback window
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000
  const recent = videos.filter((v) => new Date(v.created_at).getTime() > cutoff)

  // Fall back to all available VODs if none in window (infrequent streamers)
  const target = recent.length > 0 ? recent : videos

  // Compute average viewers weighted by stream duration
  // Longer streams carry more weight — avoids short clip outliers skewing the average
  let totalWeightedViews = 0
  let totalSeconds = 0

  for (const v of target) {
    const seconds = parseDuration(v.duration)
    totalWeightedViews += v.view_count * seconds
    totalSeconds += seconds
  }

  const average_viewers =
    totalSeconds > 0 ? Math.round(totalWeightedViews / totalSeconds) : 0

  // Compute most played games by total stream time — game_id '' means untagged, skip
  const gameSeconds: Record<string, number> = {}
  for (const v of target) {
    if (!v.game_id) continue
    gameSeconds[v.game_id] = (gameSeconds[v.game_id] ?? 0) + parseDuration(v.duration)
  }

  // Top 5 by time played
  const topGameIds = Object.entries(gameSeconds)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const most_played_games = await resolveGameNames(topGameIds, token)

  return { average_viewers, most_played_games }
}

// Checks if cached data is stale (older than threshold in hours)
export function isTwitchDataStale(syncedAt: Date | null, thresholdHours = 24): boolean {
  if (!syncedAt) return true
  const ageMs = Date.now() - new Date(syncedAt).getTime()
  return ageMs > thresholdHours * 60 * 60 * 1000
}