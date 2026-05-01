import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyProofUrl } from '../verify-proof-url'

vi.mock('../twitch', () => ({
  getAppToken: vi.fn().mockResolvedValue('fake-twitch-token'),
}))

describe('verifyProofUrl — correct branch via url-parsers', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = 'test-yt-key'
    process.env.TWITCH_CLIENT_ID = 'test-twitch-client'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    delete process.env.YOUTUBE_API_KEY
    delete process.env.TWITCH_CLIENT_ID
  })

  it('calls the YouTube API with the video ID parsed from a watch URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{
          snippet: { channelId: 'channel-xyz' },
          status: { privacyStatus: 'public' },
        }],
      }),
    } as Response)

    await verifyProofUrl('https://www.youtube.com/watch?v=abc123', {
      youtube_channel_id: 'channel-xyz',
      twitch_id: null,
    })

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('id=abc123')
  })

  it('calls the Twitch API with the VOD ID parsed from a /videos/ URL', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ user_id: 'user-456' }],
      }),
    } as Response)

    await verifyProofUrl('https://www.twitch.tv/videos/99999', {
      youtube_channel_id: null,
      twitch_id: 'user-456',
    })

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('id=99999')
  })
})
