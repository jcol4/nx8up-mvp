/**
 * YouTube Data API v3 utilities.
 *
 * All reads use an API key only — no OAuth required for public channel data.
 * All fetch calls set `revalidate: 0` to bypass Next.js caching and always
 * return live data (channel stats change frequently).
 *
 * Required env var: YOUTUBE_API_KEY
 */

/** Normalized channel data returned from the YouTube API. */
interface YouTubeChannel {
  /** YouTube channel ID (e.g. "UCxxxxxx"). */
  id: string
  /** Channel display name. */
  title: string
  /** Channel handle/customUrl (e.g. "@channelname"). */
  handle: string
  /** Total subscriber count. */
  subscriber_count: number
  /** Total number of uploaded videos. */
  video_count: number
}

/** Normalized per-video data used for stats aggregation. */
interface YouTubeVideo {
  /** YouTube video ID. */
  id: string
  /** Video title. */
  title: string
  /** Total view count at time of fetch. */
  view_count: number
  /** YouTube category ID (see YOUTUBE_CATEGORIES for name mapping). */
  category_id: string
  /** ISO 8601 publish timestamp. */
  published_at: string
}

// YouTube category ID to name mapping (gaming-relevant subset)
const YOUTUBE_CATEGORIES: Record<string, string> = {
  '1': 'Film & Entertainment',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
}

/** Returns the YouTube API key, throwing immediately if the env var is absent. */
function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY is not set')
  return key
}

/**
 * Looks up a YouTube channel by handle or username.
 * Tries the modern `forHandle` lookup first (@handle system), then falls back
 * to the legacy `forUsername` lookup for older channels without a custom handle.
 * Returns null if no channel is found under either lookup.
 */
export async function getYouTubeChannelByHandle(
  handle: string
): Promise<YouTubeChannel | null> {
  const key = getApiKey()

  // Normalize — strip leading @ if present
  const normalized = handle.replace(/^@/, '').trim()

  // Try forHandle lookup first (modern @handle system)
  const handleRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(normalized)}&key=${key}`,
    { next: { revalidate: 0 } }
  )

  if (!handleRes.ok) {
    throw new Error(`YouTube API error: ${handleRes.status}`)
  }

  const handleData = await handleRes.json()

  if (handleData.error) {
    throw new Error(`YouTube API error: ${handleData.error.message}`)
  }

  if (handleData.items?.length > 0) {
    return parseChannel(handleData.items[0], normalized)
  }

  // Fall back to legacy username search
  const userRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${encodeURIComponent(normalized)}&key=${key}`,
    { next: { revalidate: 0 } }
  )

  if (!userRes.ok) throw new Error(`YouTube API error: ${userRes.status}`)

  const userData = await userRes.json()
  if (userData.items?.length > 0) {
    return parseChannel(userData.items[0], normalized)
  }

  return null
}

/** Fetches a YouTube channel by its permanent channel ID (e.g. "UCxxxxxx"). */
export async function getYouTubeChannelById(
  channelId: string
): Promise<YouTubeChannel | null> {
  const key = getApiKey()

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}&key=${key}`,
    { next: { revalidate: 0 } }
  )

  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)

  const data = await res.json()
  if (data.items?.length > 0) {
    return parseChannel(data.items[0], data.items[0].snippet?.customUrl ?? '')
  }

  return null
}

/** Maps a raw YouTube API channel item to the normalized YouTubeChannel shape. */
function parseChannel(item: any, handle: string): YouTubeChannel {
  return {
    id: item.id,
    title: item.snippet?.title ?? '',
    handle: item.snippet?.customUrl ?? handle,
    subscriber_count: parseInt(item.statistics?.subscriberCount ?? '0'),
    video_count: parseInt(item.statistics?.videoCount ?? '0'),
  }
}

/**
 * Fetches up to `maxVideos` recent uploads for a channel and computes:
 *  - `avg_views`: mean view count across all fetched videos
 *  - `top_categories`: up to 3 most-frequent YouTube content categories by video count
 *
 * Makes 3 sequential API calls: channel details → uploads playlist → video stats.
 * A private or inaccessible uploads playlist degrades gracefully (returns zeros).
 */
export async function getYouTubeChannelStats(
  channelId: string,
  maxVideos = 50
): Promise<{ avg_views: number; top_categories: string[] }> {
  const key = getApiKey()

  // Step 1: Get the uploads playlist ID for this channel
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${key}`,
    { next: { revalidate: 0 } }
  )

  if (!channelRes.ok) throw new Error(`YouTube channel details error: ${channelRes.status}`)

  const channelData = await channelRes.json()
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!uploadsPlaylistId) {
    return { avg_views: 0, top_categories: [] }
  }

  // Step 2: Get recent video IDs from uploads playlist
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=${maxVideos}&key=${key}`,
    { next: { revalidate: 0 } }
  )

  // 404 means the uploads playlist is private or inaccessible via API key — degrade gracefully
  if (!playlistRes.ok) {
    return { avg_views: 0, top_categories: [] }
  }

  const playlistData = await playlistRes.json()
  const videoIds: string[] = (playlistData.items ?? [])
    .map((item: any) => item.contentDetails?.videoId)
    .filter(Boolean)

  if (videoIds.length === 0) {
    return { avg_views: 0, top_categories: [] }
  }

  // Step 3: Get video stats and categories in batches of 50
  const videos: YouTubeVideo[] = []
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(',')
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${encodeURIComponent(batch)}&key=${key}`,
      { next: { revalidate: 0 } }
    )

    if (!videoRes.ok) continue

    const videoData = await videoRes.json()
    for (const item of videoData.items ?? []) {
      videos.push({
        id: item.id,
        title: item.snippet?.title ?? '',
        view_count: parseInt(item.statistics?.viewCount ?? '0'),
        category_id: item.snippet?.categoryId ?? '',
        published_at: item.snippet?.publishedAt ?? '',
      })
    }
  }

  if (videos.length === 0) {
    return { avg_views: 0, top_categories: [] }
  }

  // Compute average views
  const total_views = videos.reduce((sum, v) => sum + v.view_count, 0)
  const avg_views = Math.round(total_views / videos.length)

  // Compute top categories by video count
  const categoryCounts: Record<string, number> = {}
  for (const v of videos) {
    if (!v.category_id) continue
    categoryCounts[v.category_id] = (categoryCounts[v.category_id] ?? 0) + 1
  }

  const top_categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => YOUTUBE_CATEGORIES[id] ?? `Category ${id}`)

  return { avg_views, top_categories }
}

/** Returns true if the last YouTube sync is older than `thresholdHours` (default 24h), or has never run. */
export function isYouTubeDataStale(syncedAt: Date | null, thresholdHours = 24): boolean {
  if (!syncedAt) return true
  const ageMs = Date.now() - new Date(syncedAt).getTime()
  return ageMs > thresholdHours * 60 * 60 * 1000
}