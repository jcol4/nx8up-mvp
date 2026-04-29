/**
 * Steam Web API utilities.
 *
 * Uses the team's Steam Web API key (server-side only) to look up public
 * profile and game data. Steam does not require per-user OAuth for read
 * access — the API key alone authorizes all calls — but the data must be
 * marked public on the user's profile to be returned.
 *
 * Required env vars: STEAM_API_KEY
 *
 * All functions in this module are pure and stateless. Callers handle
 * caching, persistence, and rate-limit retries. Errors from the Steam
 * API are thrown as plain `Error` objects with descriptive messages.
 */

const STEAM_API_BASE = 'https://api.steampowered.com'

/** Profile data from ISteamUser/GetPlayerSummaries. */
export interface SteamPlayerSummary {
  /** 17-digit SteamID64. */
  steamId: string
  /** Display (persona) name. */
  personaName: string
  /** Public profile URL. */
  profileUrl: string
  /** Medium avatar URL (64x64). */
  avatarUrl: string
  /**
   * Profile visibility: 1 = private, 2 = friends only, 3 = public.
   * Library/game data only available when this is 3.
   */
  communityVisibilityState: number
  /** Steam Community profile state: 1 = configured. */
  profileState: number
}

/** A game entry as returned by GetOwnedGames. */
export interface SteamOwnedGame {
  /** Steam application ID. */
  appId: number
  /** Game name (only present when include_appinfo=1). */
  name: string
  /** Total minutes played, all-time. */
  playtimeMinutes: number
  /** Minutes played in the last 2 weeks (0 if none). */
  playtime2WeeksMinutes: number
  /** Constructed icon URL, or null if no icon hash was returned. */
  iconUrl: string | null
}

/** Result of normalizing a user-provided Steam identifier. */
export interface ResolvedSteamInput {
  /** The 17-digit SteamID64. */
  steamId: string
  /** Original input form, useful for error messaging. */
  inputType: 'steamid' | 'profile_url' | 'vanity_url' | 'vanity_name'
}

/** Reads the Steam API key from the environment, throwing if unset. */
function requireApiKey(): string {
  const key = process.env.STEAM_API_KEY
  if (!key) {
    throw new Error('STEAM_API_KEY environment variable is not set.')
  }
  return key
}

/** Builds the full image URL for a game's icon hash. */
function buildIconUrl(appId: number, hash: string | undefined | null): string | null {
  if (!hash) return null
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg`
}

/**
 * Detects whether a string looks like a SteamID64. Steam IDs are 17-digit
 * numbers starting with 7656119 (the "individual account" base).
 */
function looksLikeSteamId64(value: string): boolean {
  return /^7656119\d{10}$/.test(value)
}

/**
 * Parses a user's input and returns a SteamID64. Accepts:
 *   - Raw SteamID64 ("76561198012345678")
 *   - Full profile URL with SteamID ("https://steamcommunity.com/profiles/76561198012345678")
 *   - Full profile URL with vanity name ("https://steamcommunity.com/id/somename")
 *   - Bare vanity name ("somename")
 *
 * Throws an Error if the input cannot be resolved (e.g. unknown vanity).
 */
export async function resolveSteamInput(rawInput: string): Promise<ResolvedSteamInput> {
  const input = rawInput.trim()
  if (!input) throw new Error('No Steam profile provided.')

  // Direct SteamID64
  if (looksLikeSteamId64(input)) {
    return { steamId: input, inputType: 'steamid' }
  }

  // Profile URLs
  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d+)/i)
  if (profileMatch) {
    const id = profileMatch[1]
    if (!looksLikeSteamId64(id)) {
      throw new Error('Profile URL does not contain a valid SteamID.')
    }
    return { steamId: id, inputType: 'profile_url' }
  }

  const vanityUrlMatch = input.match(/steamcommunity\.com\/id\/([^\/\?#]+)/i)
  if (vanityUrlMatch) {
    const vanity = vanityUrlMatch[1]
    const id = await resolveVanityUrl(vanity)
    return { steamId: id, inputType: 'vanity_url' }
  }

  // Bare vanity name
  const id = await resolveVanityUrl(input)
  return { steamId: id, inputType: 'vanity_name' }
}

/**
 * Calls ISteamUser/ResolveVanityURL to convert a vanity name to a SteamID64.
 * Throws if the vanity does not exist or cannot be resolved.
 */
export async function resolveVanityUrl(vanity: string): Promise<string> {
  const key = requireApiKey()
  const url = new URL(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`)
  url.searchParams.set('key', key)
  url.searchParams.set('vanityurl', vanity)

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Steam vanity lookup failed: HTTP ${res.status}`)

  const data = await res.json() as {
    response?: { success?: number; steamid?: string; message?: string }
  }
  const success = data?.response?.success
  // Steam's documented success codes: 1 = found, 42 = not found.
  if (success !== 1 || !data.response?.steamid) {
    throw new Error(`No Steam profile found for "${vanity}".`)
  }
  return data.response.steamid
}

/**
 * Fetches the public profile summary for a SteamID. Returns null if the
 * SteamID does not correspond to any account (Steam returns an empty list).
 */
export async function getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
  const key = requireApiKey()
  const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`)
  url.searchParams.set('key', key)
  url.searchParams.set('steamids', steamId)

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Steam summary lookup failed: HTTP ${res.status}`)

  const data = await res.json() as {
    response?: { players?: Array<{
      steamid: string
      personaname: string
      profileurl: string
      avatarmedium: string
      communityvisibilitystate: number
      profilestate?: number
    }> }
  }

  const player = data?.response?.players?.[0]
  if (!player) return null

  return {
    steamId: player.steamid,
    personaName: player.personaname,
    profileUrl: player.profileurl,
    avatarUrl: player.avatarmedium,
    communityVisibilityState: player.communityvisibilitystate,
    profileState: player.profilestate ?? 0,
  }
}

/**
 * Fetches the user's full game library, including total and recent playtime.
 *
 * Returns an empty array when the profile's game details are private — Steam
 * silently returns no games rather than an error in that case. The caller
 * should pair this with `getPlayerSummary` to distinguish "no games" from
 * "private profile".
 *
 * Games are returned in the order Steam provides; sorting by playtime is the
 * caller's responsibility.
 */
export async function getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
  const key = requireApiKey()
  const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`)
  url.searchParams.set('key', key)
  url.searchParams.set('steamid', steamId)
  url.searchParams.set('include_appinfo', '1')
  url.searchParams.set('include_played_free_games', '1')

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Steam owned games lookup failed: HTTP ${res.status}`)

  const data = await res.json() as {
    response?: { games?: Array<{
      appid: number
      name?: string
      playtime_forever?: number
      playtime_2weeks?: number
      img_icon_url?: string
    }> }
  }

  const games = data?.response?.games ?? []
  return games.map(g => ({
    appId: g.appid,
    name: g.name ?? `App ${g.appid}`,
    playtimeMinutes: g.playtime_forever ?? 0,
    playtime2WeeksMinutes: g.playtime_2weeks ?? 0,
    iconUrl: buildIconUrl(g.appid, g.img_icon_url),
  }))
}

/**
 * Fetches games played by the user in the last 2 weeks, with recent playtime.
 *
 * Empty array if no recent activity OR if the profile is private.
 */
export async function getRecentlyPlayedGames(steamId: string): Promise<SteamOwnedGame[]> {
  const key = requireApiKey()
  const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/`)
  url.searchParams.set('key', key)
  url.searchParams.set('steamid', steamId)

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Steam recent games lookup failed: HTTP ${res.status}`)

  const data = await res.json() as {
    response?: { games?: Array<{
      appid: number
      name?: string
      playtime_forever?: number
      playtime_2weeks?: number
      img_icon_url?: string
    }> }
  }

  const games = data?.response?.games ?? []
  return games.map(g => ({
    appId: g.appid,
    name: g.name ?? `App ${g.appid}`,
    playtimeMinutes: g.playtime_forever ?? 0,
    playtime2WeeksMinutes: g.playtime_2weeks ?? 0,
    iconUrl: buildIconUrl(g.appid, g.img_icon_url),
  }))
}

/** Convenience: minutes → hours, rounded to 1 decimal. */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10
}