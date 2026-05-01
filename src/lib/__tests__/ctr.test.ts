import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computeAndStoreSubmissionCtr, recomputeCreatorAggregateCtr } from '../ctr'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    campaign_applications: {
      findUnique: vi.fn(),
    },
    deal_submissions: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    content_creators: {
      update: vi.fn(),
    },
  },
}))

vi.mock('../twitch', () => ({
  getAppToken: vi.fn().mockResolvedValue('fake-twitch-token'),
}))

// ── computeAndStoreSubmissionCtr ─────────────────────────────────────────────

describe('computeAndStoreSubmissionCtr — routing', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = 'test-yt-key'
    process.env.TWITCH_CLIENT_ID = 'test-twitch-client'
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(prisma.deal_submissions.update).mockResolvedValue({} as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    delete process.env.YOUTUBE_API_KEY
    delete process.env.TWITCH_CLIENT_ID
  })

  it('calls the YouTube API with the video ID parsed from a proof URL', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({
      _count: { link_clicks: 10 },
      deal_submission: { proof_urls: ['https://www.youtube.com/watch?v=abc123'] },
    } as any)

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ statistics: { viewCount: '1000' } }] }),
    } as Response)

    await computeAndStoreSubmissionCtr('app-id')

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('id=abc123')
  })

  it('calls the Twitch API with the VOD ID parsed from a proof URL', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({
      _count: { link_clicks: 10 },
      deal_submission: { proof_urls: ['https://www.twitch.tv/videos/99999'] },
    } as any)

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ view_count: 500 }] }),
    } as Response)

    await computeAndStoreSubmissionCtr('app-id')

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('id=99999')
  })
})

describe('computeAndStoreSubmissionCtr — CTR calculation', () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = 'test-yt-key'
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(prisma.deal_submissions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({
      _count: { link_clicks: 10 },
      deal_submission: { proof_urls: ['https://www.youtube.com/watch?v=abc123'] },
    } as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    delete process.env.YOUTUBE_API_KEY
  })

  it('writes the correct CTR value: (clicks / views) * 100', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ statistics: { viewCount: '1000' } }] }),
    } as Response)

    await computeAndStoreSubmissionCtr('app-id')

    // 10 clicks / 1000 views * 100 = 1.0
    expect(vi.mocked(prisma.deal_submissions.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ctr: 1 }),
      })
    )
  })

  it('caps CTR at 999.99 when clicks exceed views', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({
      _count: { link_clicks: 1000 },
      deal_submission: { proof_urls: ['https://www.youtube.com/watch?v=abc123'] },
    } as any)

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ statistics: { viewCount: '100' } }] }),
    } as Response)

    await computeAndStoreSubmissionCtr('app-id')

    // 1000 clicks / 100 views * 100 = 1000 → capped
    expect(vi.mocked(prisma.deal_submissions.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ctr: 999.99 }),
      })
    )
  })

  it('does not write to DB when the API returns zero views', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ statistics: { viewCount: '0' } }] }),
    } as Response)

    await computeAndStoreSubmissionCtr('app-id')

    expect(vi.mocked(prisma.deal_submissions.update)).not.toHaveBeenCalled()
  })

  it('does not write to DB when the API returns no view data', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    } as Response)

    await computeAndStoreSubmissionCtr('app-id')

    expect(vi.mocked(prisma.deal_submissions.update)).not.toHaveBeenCalled()
  })
})

// ── recomputeCreatorAggregateCtr ─────────────────────────────────────────────

describe('recomputeCreatorAggregateCtr', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('averages stored CTRs and writes the result to engagement_rate', async () => {
    vi.mocked(prisma.deal_submissions.findMany).mockResolvedValue([
      { ctr: 50 },
      { ctr: 100 },
    ] as any)
    vi.mocked(prisma.content_creators.update).mockResolvedValue({} as any)

    await recomputeCreatorAggregateCtr('creator-id')

    // (50 + 100) / 2 = 75
    expect(vi.mocked(prisma.content_creators.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ engagement_rate: 75 }),
      })
    )
  })

  it('caps aggregate engagement_rate at 999.99', async () => {
    vi.mocked(prisma.deal_submissions.findMany).mockResolvedValue([
      { ctr: 999.99 },
      { ctr: 999.99 },
    ] as any)
    vi.mocked(prisma.content_creators.update).mockResolvedValue({} as any)

    await recomputeCreatorAggregateCtr('creator-id')

    expect(vi.mocked(prisma.content_creators.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ engagement_rate: 999.99 }),
      })
    )
  })

  it('does not write to DB when the creator has no stored CTRs', async () => {
    vi.mocked(prisma.deal_submissions.findMany).mockResolvedValue([])

    await recomputeCreatorAggregateCtr('creator-id')

    expect(vi.mocked(prisma.content_creators.update)).not.toHaveBeenCalled()
  })
})
