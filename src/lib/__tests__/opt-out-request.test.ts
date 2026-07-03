import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { requestOptOut } from '../../app/[locale]/creator/campaigns/_actions'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    content_creators: { findUnique: vi.fn() },
    campaign_applications: { findUnique: vi.fn(), update: vi.fn() },
    creator_opt_outs: { create: vi.fn() },
  },
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { auth } from '@clerk/nextjs/server'

const creatorClaims = { userId: 'user-1' }

const futureDate = new Date(Date.now() + 10 * 86_400_000)
const pastDate = new Date(Date.now() - 1 * 86_400_000)

const validApp = {
  id: 'app-1',
  creator_id: 'creator-1',
  status: 'accepted',
  opt_out: null,
  campaign: { id: 'campaign-1', title: 'Test', start_date: futureDate },
  creator: { id: 'creator-1', clerk_user_id: 'user-1' },
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue(creatorClaims as any)
  vi.mocked(prisma.content_creators.findUnique).mockResolvedValue({ id: 'creator-1' } as any)
  vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(validApp as any)
  vi.mocked(prisma.campaign_applications.update).mockResolvedValue({} as any)
  vi.mocked(prisma.creator_opt_outs.create).mockResolvedValue({} as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('requestOptOut', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const res = await requestOptOut('app-1', 'Going on holiday')
    expect(res.error).toBeDefined()
  })

  it('returns error when creator not found', async () => {
    vi.mocked(prisma.content_creators.findUnique).mockResolvedValue(null)
    const res = await requestOptOut('app-1', 'Going on holiday')
    expect(res.error).toBeDefined()
  })

  it('returns error when application not found or not owned by creator', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(null)
    const res = await requestOptOut('app-1', 'Going on holiday')
    expect(res.error).toBeDefined()
  })

  it('returns error when campaign has already started', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({
      ...validApp,
      campaign: { ...validApp.campaign, start_date: pastDate },
    } as any)
    const res = await requestOptOut('app-1', 'Going on holiday')
    expect(res.error).toMatch(/started/i)
  })

  it('returns error when opt-out already exists', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({
      ...validApp,
      opt_out: { id: 'existing-opt-out' },
    } as any)
    const res = await requestOptOut('app-1', 'Going on holiday')
    expect(res.error).toMatch(/already/i)
  })

  it('creates opt-out record and sets application status to opted_out', async () => {
    const res = await requestOptOut('app-1', 'Going on holiday')
    expect(res.success).toBe(true)
    expect(prisma.creator_opt_outs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          application_id: 'app-1',
          creator_id: 'creator-1',
          reason: 'Going on holiday',
          verdict: 'pending',
        }),
      }),
    )
    expect(prisma.campaign_applications.update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: { status: 'opted_out' },
    })
  })

  it('returns error when reason is empty', async () => {
    const res = await requestOptOut('app-1', '')
    expect(res.error).toBeDefined()
  })
})
