/** Extracts a YouTube video ID from a parsed URL. Supports watch, youtu.be, shorts, live, embed. */
export function extractYouTubeVideoId(url: URL): string | null {
  const { hostname, pathname, searchParams } = url
  if (hostname === 'youtu.be') return pathname.slice(1).split('/')[0] || null
  if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
    if (pathname.startsWith('/watch')) return searchParams.get('v')
    const m = pathname.match(/^\/(shorts|live|embed)\/([^/?]+)/)
    if (m) return m[2]
  }
  return null
}

/** Extracts a Twitch VOD or clip ID from a parsed URL. Supports /videos/, /clip/, and clips.twitch.tv. */
export function extractTwitchVideoId(url: URL): { type: 'vod' | 'clip'; id: string } | null {
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
  return null
}
