import { describe, it, expect } from 'vitest'
import { extractYouTubeVideoId, extractTwitchVideoId } from '../url-parsers'

describe('extractYouTubeVideoId', () => {
  it('extracts video ID from watch?v= URL', () => {
    expect(extractYouTubeVideoId(new URL('https://www.youtube.com/watch?v=abc123'))).toBe('abc123')
  })

  it('extracts video ID from youtu.be short URL', () => {
    expect(extractYouTubeVideoId(new URL('https://youtu.be/abc123'))).toBe('abc123')
  })

  it('extracts video ID from /shorts/ URL', () => {
    expect(extractYouTubeVideoId(new URL('https://www.youtube.com/shorts/abc123'))).toBe('abc123')
  })

  it('extracts video ID from /live/ URL', () => {
    expect(extractYouTubeVideoId(new URL('https://www.youtube.com/live/abc123'))).toBe('abc123')
  })

  it('extracts video ID from /embed/ URL', () => {
    expect(extractYouTubeVideoId(new URL('https://www.youtube.com/embed/abc123'))).toBe('abc123')
  })

  it('returns null for a non-YouTube URL', () => {
    expect(extractYouTubeVideoId(new URL('https://www.twitch.tv/videos/99999'))).toBeNull()
  })
})

describe('extractTwitchVideoId', () => {
  it('extracts VOD ID from /videos/ URL', () => {
    expect(extractTwitchVideoId(new URL('https://www.twitch.tv/videos/99999'))).toEqual({ type: 'vod', id: '99999' })
  })

  it('extracts clip slug from /clip/ URL', () => {
    expect(extractTwitchVideoId(new URL('https://www.twitch.tv/streamer/clip/ClipSlug'))).toEqual({ type: 'clip', id: 'ClipSlug' })
  })

  it('extracts clip slug from clips.twitch.tv URL', () => {
    expect(extractTwitchVideoId(new URL('https://clips.twitch.tv/ClipSlug'))).toEqual({ type: 'clip', id: 'ClipSlug' })
  })

  it('returns null for a non-Twitch URL', () => {
    expect(extractTwitchVideoId(new URL('https://www.youtube.com/watch?v=abc123'))).toBeNull()
  })
})
