import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getActiveCampaigns } from '../../app/[locale]/creator/campaigns/_actions'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { findUnique: vi.fn() },
    campaign_applications: { findMany: vi.fn() },
  },
}))

import { auth } from '@clerk/nextjs/server'

const acceptedLaunchedApp = {
  id: 'app-1',
  status: 'accepted',
  campaign: { id: 'c-1', title: 'Game Launch', status: 'launched', start_date: null, end_date: null, budget: null, creator_count: null, brand_name: null, sponsor: { company_name: 'Acme', clerk_user_id: 'u-1' } },
  opt_out: null,
}

const acceptedLiveApp = {
  id: 'app-2',
  status: 'accepted',
  campaign: { id: 'c-2', title: 'Live Campaign', status: 'live', start_date: null, end_date: null, budget: null, creator_count: null, brand_name: null, sponsor: { company_name: 'Beta', clerk_user_id: 'u-2' } },
  opt_out: null,
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any)
  vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ id: 'creator-1' } as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('getActiveCampaigns', () => {
  it('by default queries with campaign status=launched filter', async () => {
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([acceptedLaunchedApp] as any)

    await getActiveCampaigns()

    expect(prisma.campaign_applications.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          campaign: { status: 'launched' },
        }),
      }),
    )
  })

  it('with all=true queries without campaign status filter', async () => {
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([acceptedLaunchedApp, acceptedLiveApp] as any)

    await getActiveCampaigns({ all: true })

    const call = vi.mocked(prisma.campaign_applications.findMany).mock.calls[0][0]
    expect((call as any).where).not.toHaveProperty('campaign')
  })

  it('includes opt_out on each application', async () => {
    const appWithOptOut = { ...acceptedLaunchedApp, opt_out: { id: 'opt-1', verdict: 'pending' } }
    vi.mocked(prisma.campaign_applications.findMany).mockResolvedValue([appWithOptOut] as any)

    const result = await getActiveCampaigns()

    expect(result[0].opt_out).toEqual({ id: 'opt-1', verdict: 'pending' })
  })

  it('returns empty array when creator not found', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(null)

    const result = await getActiveCampaigns()

    expect(result).toEqual([])
    expect(prisma.campaign_applications.findMany).not.toHaveBeenCalled()
  })

  it('returns empty array when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const result = await getActiveCampaigns()

    expect(result).toEqual([])
  })
})
