import { describe, it, expect } from 'vitest'
import {
  requiredPlatformsForCampaign,
  linkedPlatformsForCreator,
  missingLinkedPlatforms,
  detectProofPlatform,
} from '../platforms'

describe('requiredPlatformsForCampaign', () => {
  it('derives platforms from content_type media forms', () => {
    expect(
      requiredPlatformsForCampaign({ platform: [], content_type: ['twitch_clip'] }),
    ).toEqual(['Twitch'])
    expect(
      requiredPlatformsForCampaign({ platform: [], content_type: ['youtube_short'] }),
    ).toEqual(['YouTube'])
  })

  it('unions content_type-derived platforms with the platform array', () => {
    const result = requiredPlatformsForCampaign({
      platform: ['YouTube'],
      content_type: ['twitch_stream'],
    })
    expect(result.sort()).toEqual(['Twitch', 'YouTube'])
  })

  it('deduplicates when content_type and platform agree', () => {
    expect(
      requiredPlatformsForCampaign({ platform: ['Twitch'], content_type: ['twitch_clip'] }),
    ).toEqual(['Twitch'])
  })

  it('filters out unsupported platforms (TikTok / Instagram)', () => {
    expect(
      requiredPlatformsForCampaign({ platform: ['TikTok', 'Instagram'], content_type: [] }),
    ).toEqual([])
  })

  it('returns empty for a campaign with no verifiable requested platform', () => {
    expect(requiredPlatformsForCampaign({ platform: [], content_type: [] })).toEqual([])
  })
})

describe('linkedPlatformsForCreator', () => {
  it('lists only platforms with a non-null account id', () => {
    expect(
      linkedPlatformsForCreator({ twitch_id: 't1', youtube_channel_id: null }),
    ).toEqual(['Twitch'])
    expect(
      linkedPlatformsForCreator({ twitch_id: 't1', youtube_channel_id: 'yt1' }).sort(),
    ).toEqual(['Twitch', 'YouTube'])
    expect(
      linkedPlatformsForCreator({ twitch_id: null, youtube_channel_id: null }),
    ).toEqual([])
  })
})

describe('missingLinkedPlatforms (ALL semantics)', () => {
  it('is empty when every requested platform is linked', () => {
    expect(
      missingLinkedPlatforms(
        { platform: ['Twitch'], content_type: ['twitch_clip'] },
        { twitch_id: 't1', youtube_channel_id: null },
      ),
    ).toEqual([])
  })

  it('flags a requested platform that is not linked', () => {
    expect(
      missingLinkedPlatforms(
        { platform: [], content_type: ['youtube_video'] },
        { twitch_id: 't1', youtube_channel_id: null },
      ),
    ).toEqual(['YouTube'])
  })

  it('requires ALL platforms when a campaign spans two', () => {
    // Creator has only Twitch linked; campaign wants Twitch + YouTube.
    expect(
      missingLinkedPlatforms(
        { platform: ['YouTube'], content_type: ['twitch_clip'] },
        { twitch_id: 't1', youtube_channel_id: null },
      ),
    ).toEqual(['YouTube'])
  })

  it('never gates on unsupported requested platforms', () => {
    expect(
      missingLinkedPlatforms(
        { platform: ['TikTok'], content_type: [] },
        { twitch_id: null, youtube_channel_id: null },
      ),
    ).toEqual([])
  })
})

describe('detectProofPlatform', () => {
  it('detects YouTube hosts', () => {
    expect(detectProofPlatform('https://www.youtube.com/watch?v=abc')).toBe('YouTube')
    expect(detectProofPlatform('https://youtu.be/abc')).toBe('YouTube')
    expect(detectProofPlatform('https://youtube.com/shorts/abc')).toBe('YouTube')
  })

  it('detects Twitch hosts', () => {
    expect(detectProofPlatform('https://www.twitch.tv/videos/123')).toBe('Twitch')
    expect(detectProofPlatform('https://clips.twitch.tv/SomeClip')).toBe('Twitch')
  })

  it('returns null for unsupported hosts', () => {
    expect(detectProofPlatform('https://www.tiktok.com/@x/video/1')).toBeNull()
    expect(detectProofPlatform('https://instagram.com/p/abc')).toBeNull()
  })

  it('returns null for an unparseable URL', () => {
    expect(detectProofPlatform('not a url')).toBeNull()
  })
})
