/**
 * CTR (click-through rate) computation utilities.
 *
 * Two public functions:
 *  - computeAndStoreSubmissionCtr: fetches live view counts from YouTube/Twitch
 *    and writes CTR to the deal_submissions row.
 *  - recomputeCreatorAggregateCtr: averages stored per-submission CTRs and
 *    writes the result to content_creators.engagement_rate.
 *
 * CTR formula: (tracked link clicks / avg video views) * 100, capped at 999.99%.
 */
import { prisma } from './prisma'
import { getAppToken } from './twitch'

// ── URL parsers (mirrors verify-proof-url.ts — kept local to avoid coupling) ─

/** Extracts a YouTube video ID from any supported URL format (watch, youtu.be, shorts, live, embed). */
function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    const { hostname, pathname, searchParams } = url
    if (hostname === 'youtu.be') return pathname.slice(1).split('/')[0] || null
    if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
      if (pathname.startsWith('/watch')) return searchParams.get('v')
      const m = pathname.match(/^\/(shorts|live|embed)\/([^/?]+)/)
      if (m) return m[2]
    }
  } catch {}
  return null
}

/** Extracts a Twitch VOD or clip ID from any supported URL format (twitch.tv/videos, /clip/, clips.twitch.tv). */
function extractTwitchVideoId(rawUrl: string): { type: 'vod' | 'clip'; id: string } | null {
  try {
    const url = new URL(rawUrl)
    const { hostname, pathname } = url
    if (hostname === 'twitch.tv' || hostname === 'www.twitch.tv') {
      const vod = pathname.match(/^\/videos\/(\d+)/)
      if (vod) return { type: 'vod', id: vod[1] }
      const clip = pathname.match(/^\/[^/]+\/clip\/([^/?]+)/)
      if (clip) return { type: 'clip', id: clip[1] }
    }
    if (hostname === 'clips.twitch.tv') {
      const id = pathname.slice(1).split('/')[0]
      if (id) return { type: 'clip', id }
    }
  } catch {}
  return null
}



// ── View count fetcher ───────────────────────────────────────────────────────

/**
 * Fetches the current view count for a single proof URL from YouTube or Twitch.
 * Returns null for unsupported domains, missing API keys, or any fetch error.
 */
async function fetchViewsForUrl(rawUrl: string): Promise<number | null> {
  try {
    const url = new URL(rawUrl)
    const { hostname } = url

    if (hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be') {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (!apiKey) return null
      const videoId = extractYouTubeVideoId(rawUrl)
      if (!videoId) return null
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(videoId)}&key=${apiKey}`,
        { next: { revalidate: 0 } },
      )
      if (!res.ok) return null
      const data = await res.json()
      const viewCount = data.items?.[0]?.statistics?.viewCount
      return viewCount != null ? parseInt(viewCount, 10) : null
    }

    if (hostname === 'twitch.tv' || hostname === 'www.twitch.tv' || hostname === 'clips.twitch.tv') {
      const parsed = extractTwitchVideoId(rawUrl)
      if (!parsed) return null
      const token = await getAppToken()
      const endpoint =
        parsed.type === 'vod'
          ? `https://api.twitch.tv/helix/videos?id=${encodeURIComponent(parsed.id)}`
          : `https://api.twitch.tv/helix/clips?id=${encodeURIComponent(parsed.id)}`
      const res = await fetch(endpoint, {
        headers: {
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.data?.[0]?.view_count ?? null
    }
  } catch {}
  return null
}

// ── Per-submission CTR ───────────────────────────────────────────────────────

/**
 * Fetches current view counts for all proof URLs in a submission via OAuth
 * (YouTube API key / Twitch app token — creators cannot self-report).
 * Computes CTR = (clicks / avg_video_views) * 100 and stores on deal_submissions.
 */
export async function computeAndStoreSubmissionCtr(applicationId: string): Promise<void> {
  const app = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    select: {
      _count: { select: { link_clicks: true } },
      deal_submission: { select: { proof_urls: true } },
    },
  })

  const sub = app?.deal_submission
  if (!sub || sub.proof_urls.length === 0) return

  const viewCounts = await Promise.all(sub.proof_urls.map(fetchViewsForUrl))

  const valid = viewCounts.filter((v): v is number => v !== null && v > 0)
  if (valid.length === 0) return

  const avgViews = valid.reduce((a, b) => a + b, 0) / valid.length
  const clicks = app!._count.link_clicks
  const ctr = Math.min((clicks / avgViews) * 100, 999.99)

  const videoViews: Record<string, number> = {}
  sub.proof_urls.forEach((url, i) => {
    if (viewCounts[i] !== null) videoViews[url] = viewCounts[i]!
  })

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { video_views: videoViews, ctr, views_fetched_at: new Date() },
  })
}

// ── Aggregate CTR ────────────────────────────────────────────────────────────

/**
 * Averages stored per-submission CTRs from the DB and writes the result to
 * content_creators.engagement_rate. Makes no external API calls — safe to
 * call on every OAuth resync without multiplying API usage with creator count.
 */
export async function recomputeCreatorAggregateCtr(creatorId: string): Promise<void> {
  const submissions = await prisma.deal_submissions.findMany({
    where: {
      application: { creator_id: creatorId },
      ctr: { not: null },
    },
    select: { ctr: true },
  })

  if (submissions.length === 0) return

  const total = submissions.reduce((sum, s) => sum + Number(s.ctr), 0)
  const aggregate = Math.min(total / submissions.length, 999.99)

  await prisma.content_creators.update({
    where: { id: creatorId },
    data: { engagement_rate: aggregate },
  })
}
