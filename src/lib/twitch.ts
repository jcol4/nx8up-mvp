/**
 * Twitch Helix API utilities.
 *
 * Uses a client-credentials app access token (no user OAuth required) for all
 * public data reads. The token is cached in module-level memory and refreshed
 * automatically 60 seconds before expiry.
 *
 * Required env vars: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
 */

/** In-memory cache entry for a Twitch app access token. */
interface AppToken {
  access_token: string
  /** Unix timestamp (ms) after which the token should be considered expired. */
  expires_at: number
}

/** Normalized Twitch user/channel data from GET /helix/users. */
interface TwitchUser {
  /** Twitch user/broadcaster ID. */
  id: string
  /** Lowercase login name (used in channel URLs). */
  login: string
  /** Display name as shown on Twitch. */
  display_name: string
  /** "" | "affiliate" | "partner" */
  broadcaster_type: string
  /** Channel bio text. */
  description: string
  /** URL of the channel profile image. */
  profile_image_url: string
  /** ISO 8601 account creation timestamp. */
  created_at: string
}

/** Normalized VOD data from GET /helix/videos. */
interface TwitchVideo {
  id: string
  user_id: string
  title: string
  /** Twitch duration string format (e.g. "3h8m33s"). */
  duration: string
  view_count: number
  /** ISO 8601 broadcast timestamp. */
  created_at: string
  /** Twitch game ID played during this VOD. */
  game_id: string
}

let cachedToken: AppToken | null = null

/**
 * Returns a valid Twitch app access token, fetching a new one from the OAuth
 * endpoint only when the cached token is absent or within 60s of expiry.
 */
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

/** Looks up a Twitch user by their login name (case-insensitive). Returns null if not found. */
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

/** Looks up a Twitch user by their numeric broadcaster ID. Returns null if not found. */
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

/**
 * Returns the total follower count for a broadcaster.
 * Uses GET /helix/channels/followers with an app access token.
 */
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

/** Converts a Twitch VOD duration string (e.g. "3h8m33s") to total seconds. */
function parseDuration(duration: string): number {
  const hours = parseInt(duration.match(/(\d+)h/)?.[1] ?? '0')
  const minutes = parseInt(duration.match(/(\d+)m/)?.[1] ?? '0')
  const seconds = parseInt(duration.match(/(\d+)s/)?.[1] ?? '0')
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Resolves a list of Twitch game IDs to their display names via GET /helix/games.
 * Falls back to returning the raw IDs if the name lookup fails.
 */
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

/**
 * Fetches up to 100 recent VODs for a broadcaster and computes:
 *  - `average_vod_views`: mean view count across VODs within the lookback window
 *  - `most_played_games`: up to 5 games by total stream time, resolved to display names
 *
 * Uses GET /helix/videos (app token only). Prefers VODs within `lookbackDays`;
 * falls back to all available VODs if none fall within that window.
 * VODs expire after 14 days (non-partner) or 60 days (partner) — derived metrics
 * should be persisted immediately after this call.
 */
export async function getTwitchStreamStats(
  userId: string,
  lookbackDays = 28
): Promise<{ average_vod_views: number; most_played_games: string[] }> {
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
    return { average_vod_views: 0, most_played_games: [] }
  }

  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000
  const recent = videos.filter((v) => new Date(v.created_at).getTime() > cutoff)
  const target = recent.length > 0 ? recent : videos

  const total_views = target.reduce((sum, v) => sum + v.view_count, 0)
  const average_vod_views = Math.round(total_views / target.length)

  const gameSeconds: Record<string, number> = {}
  for (const v of target) {
    if (!v.game_id) continue
    gameSeconds[v.game_id] = (gameSeconds[v.game_id] ?? 0) + parseDuration(v.duration)
  }

  const topGameIds = Object.entries(gameSeconds)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const most_played_games = await resolveGameNames(topGameIds, token)

  return { average_vod_views, most_played_games }
}
/** Returns true if the last Twitch sync is older than `thresholdHours` (default 24h), or has never run. */
export function isTwitchDataStale(syncedAt: Date | null, thresholdHours = 24): boolean {
  if (!syncedAt) return true
  const ageMs = Date.now() - new Date(syncedAt).getTime()
  return ageMs > thresholdHours * 60 * 60 * 1000
}