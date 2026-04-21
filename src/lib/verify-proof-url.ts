/**
 * Proof URL verification — confirms that a submitted VOD/clip/video URL belongs
 * to the creator's connected platform account.
 *
 * Three possible outcomes:
 *  - 'verified':      URL is public and belongs to the creator's connected account.
 *  - 'unverifiable':  Cannot check ownership (API key missing, platform unsupported,
 *                     or creator has not connected that platform). Sponsor reviews manually.
 *  - 'failed':        URL is invalid, video not found, video is private, or belongs
 *                     to a different channel. Creator must resubmit.
 */

/** Discriminated union returned by verifyProofUrl and its internal helpers. */
export type VerifyResult =
  | { status: 'verified'; platform: string }
  | { status: 'unverifiable'; platform: string; reason: string }
  | { status: 'failed'; platform: string; error: string }

/** The connected platform account IDs needed to verify proof URL ownership. */
type CreatorIds = {
  twitch_id: string | null
  youtube_channel_id: string | null
}

// ── URL parsers ──────────────────────────────────────────────────────────────

/** Extracts a YouTube video ID from a pre-parsed URL object. Supports watch, youtu.be, shorts, live, embed. */
function extractYouTubeVideoId(url: URL): string | null {
  const { hostname, pathname, searchParams } = url
  if (hostname === 'youtu.be') return pathname.slice(1).split('/')[0] || null
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
    if (pathname.startsWith('/watch')) return searchParams.get('v')
    const shortMatch = pathname.match(/^\/(shorts|live|embed)\/([^/?]+)/)
    if (shortMatch) return shortMatch[2]
  }
  return null
}

/** Extracts a Twitch VOD or clip ID from a pre-parsed URL object. Supports /videos/, /clip/, and clips.twitch.tv. */
function extractTwitchVideoId(url: URL): { type: 'vod'; id: string } | { type: 'clip'; id: string } | null {
  const { hostname, pathname } = url
  if (hostname === 'twitch.tv' || hostname === 'www.twitch.tv') {
    const vodMatch = pathname.match(/^\/videos\/(\d+)/)
    if (vodMatch) return { type: 'vod', id: vodMatch[1] }
    const clipMatch = pathname.match(/^\/[^/]+\/clip\/([^/?]+)/)
    if (clipMatch) return { type: 'clip', id: clipMatch[1] }
  }
  if (hostname === 'clips.twitch.tv') {
    const clipId = pathname.slice(1).split('/')[0]
    if (clipId) return { type: 'clip', id: clipId }
  }
  return null
}

// ── Platform verifiers ───────────────────────────────────────────────────────

/** Verifies a YouTube video ID against the creator's connected channel ID via the YouTube Data API. */
async function verifyYouTube(videoId: string, channelId: string): Promise<VerifyResult> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    return { status: 'unverifiable', platform: 'YouTube', reason: 'YouTube API key not configured.' }
  }

  let res: Response
  try {
    res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${encodeURIComponent(videoId)}&key=${apiKey}`,
      { next: { revalidate: 0 } },
    )
  } catch {
    return { status: 'unverifiable', platform: 'YouTube', reason: 'Could not reach YouTube API.' }
  }

  if (!res.ok) {
    return { status: 'unverifiable', platform: 'YouTube', reason: `YouTube API error ${res.status}.` }
  }

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) {
    return { status: 'failed', platform: 'YouTube', error: 'Video not found. Make sure it is set to public.' }
  }

  if (item.status?.privacyStatus !== 'public') {
    return {
      status: 'failed',
      platform: 'YouTube',
      error: `This video is ${item.status?.privacyStatus ?? 'not public'}. Only public videos can be submitted as proof.`,
    }
  }

  if (item.snippet.channelId !== channelId) {
    return {
      status: 'failed',
      platform: 'YouTube',
      error: 'This video does not belong to your connected YouTube channel.',
    }
  }

  return { status: 'verified', platform: 'YouTube' }
}

/** Fetches a short-lived Twitch app access token for proof verification. Not cached — one call per verification. */
async function getTwitchAppToken(): Promise<string> {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Twitch token error: ${res.status}`)
  const data = await res.json()
  return data.access_token
}

/** Verifies a Twitch VOD ID against the creator's connected Twitch user ID via GET /helix/videos. */
async function verifyTwitchVod(videoId: string, twitchUserId: string): Promise<VerifyResult> {
  let token: string
  try {
    token = await getTwitchAppToken()
  } catch {
    return { status: 'unverifiable', platform: 'Twitch', reason: 'Could not reach Twitch API.' }
  }

  const res = await fetch(
    `https://api.twitch.tv/helix/videos?id=${encodeURIComponent(videoId)}`,
    {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    },
  )

  if (!res.ok) {
    return { status: 'unverifiable', platform: 'Twitch', reason: `Twitch API error ${res.status}.` }
  }

  const data = await res.json()
  const video = data.data?.[0]
  if (!video) {
    return { status: 'failed', platform: 'Twitch', error: 'VOD not found. It may have expired or been deleted.' }
  }

  if (video.user_id !== twitchUserId) {
    return {
      status: 'failed',
      platform: 'Twitch',
      error: 'This VOD does not belong to your connected Twitch account.',
    }
  }

  return { status: 'verified', platform: 'Twitch' }
}

/** Verifies a Twitch clip ID against the creator's connected Twitch user ID via GET /helix/clips. */
async function verifyTwitchClip(clipId: string, twitchUserId: string): Promise<VerifyResult> {
  let token: string
  try {
    token = await getTwitchAppToken()
  } catch {
    return { status: 'unverifiable', platform: 'Twitch', reason: 'Could not reach Twitch API.' }
  }

  const res = await fetch(
    `https://api.twitch.tv/helix/clips?id=${encodeURIComponent(clipId)}`,
    {
      headers: {
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    },
  )

  if (!res.ok) {
    return { status: 'unverifiable', platform: 'Twitch', reason: `Twitch API error ${res.status}.` }
  }

  const data = await res.json()
  const clip = data.data?.[0]
  if (!clip) {
    return { status: 'failed', platform: 'Twitch', error: 'Clip not found.' }
  }

  if (clip.broadcaster_id !== twitchUserId) {
    return {
      status: 'failed',
      platform: 'Twitch',
      error: 'This clip does not belong to your connected Twitch account.',
    }
  }

  return { status: 'verified', platform: 'Twitch' }
}

// ── Timestamp fetcher ────────────────────────────────────────────────────────

/**
 * Fetches the publish/broadcast timestamp for a YouTube video or Twitch VOD/clip.
 * Returns an ISO 8601 string, or null if the URL is unsupported or the API call fails.
 * Used to record when content was published relative to campaign start dates.
 */
export async function fetchPostTimestamp(rawUrl: string): Promise<string | null> {
  let url: URL
  try { url = new URL(rawUrl) } catch { return null }

  const { hostname } = url

  // YouTube
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be') {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) return null
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) return null
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}&key=${apiKey}`,
        { next: { revalidate: 0 } },
      )
      if (!res.ok) return null
      const data = await res.json()
      const publishedAt: string | undefined = data.items?.[0]?.snippet?.publishedAt
      return publishedAt ?? null
    } catch { return null }
  }

  // Twitch VOD or clip
  if (hostname === 'twitch.tv' || hostname === 'www.twitch.tv' || hostname === 'clips.twitch.tv') {
    const parsed = extractTwitchVideoId(url)
    if (!parsed) return null
    try {
      const token = await getTwitchAppToken()
      const endpoint =
        parsed.type === 'vod'
          ? `https://api.twitch.tv/helix/videos?id=${encodeURIComponent(parsed.id)}`
          : `https://api.twitch.tv/helix/clips?id=${encodeURIComponent(parsed.id)}`
      const res = await fetch(endpoint, {
        headers: {
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
          'Authorization': `Bearer ${token}`,
        },
        next: { revalidate: 0 },
      })
      if (!res.ok) return null
      const data = await res.json()
      const createdAt: string | undefined = data.data?.[0]?.created_at
      return createdAt ?? null
    } catch { return null }
  }

  return null
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Main entry point — verifies that `rawUrl` is a valid, public proof URL
 * belonging to the creator's connected YouTube or Twitch account.
 * Unrecognized platforms return 'unverifiable' for manual sponsor review.
 */
export async function verifyProofUrl(rawUrl: string, creator: CreatorIds): Promise<VerifyResult> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { status: 'failed', platform: 'Unknown', error: 'Invalid URL.' }
  }

  const { hostname } = url

  // YouTube
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be') {
    if (!creator.youtube_channel_id) {
      return {
        status: 'unverifiable',
        platform: 'YouTube',
        reason: 'You have not connected a YouTube account. Connect it in your profile to enable verification.',
      }
    }
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return { status: 'failed', platform: 'YouTube', error: 'Could not parse a video ID from this YouTube URL.' }
    }
    return verifyYouTube(videoId, creator.youtube_channel_id)
  }

  // Twitch
  if (hostname === 'twitch.tv' || hostname === 'www.twitch.tv' || hostname === 'clips.twitch.tv') {
    if (!creator.twitch_id) {
      return {
        status: 'unverifiable',
        platform: 'Twitch',
        reason: 'You have not connected a Twitch account. Connect it in your profile to enable verification.',
      }
    }
    const parsed = extractTwitchVideoId(url)
    if (!parsed) {
      return { status: 'failed', platform: 'Twitch', error: 'Could not parse a VOD or clip ID from this Twitch URL.' }
    }
    if (parsed.type === 'vod') return verifyTwitchVod(parsed.id, creator.twitch_id)
    return verifyTwitchClip(parsed.id, creator.twitch_id)
  }

  // Unrecognized platform — allow but flag
  return {
    status: 'unverifiable',
    platform: 'Other',
    reason: 'Ownership cannot be automatically verified for this platform. The sponsor will review manually.',
  }
}
