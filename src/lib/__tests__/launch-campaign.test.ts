import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { launchCampaign } from '../../app/[locale]/sponsor/campaigns/_actions'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    sponsors: { findUnique: vi.fn() },
    campaigns: { findUnique: vi.fn(), update: vi.fn() },
    sanctioned_launch_requests: { findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('../sponsor-dashboard-cache', () => ({
  sponsorDashboardCacheTag: vi.fn().mockReturnValue('tag'),
}))

import { auth } from '@clerk/nextjs/server'
import { createNotification } from '../notifications'

const NOW = new Date('2026-05-04T00:00:00Z')
const YESTERDAY = new Date('2026-05-03T00:00:00Z')
const IN_8_DAYS = new Date('2026-05-12T00:00:00Z')
const IN_1_DAY = new Date('2026-05-05T00:00:00Z')
const TEN_DAYS_AGO = new Date('2026-04-24T00:00:00Z')

const validSponsor = { id: 'sponsor-1', reputation_tier: 'neutral' }
const acceptedApps = [
  { id: 'app-1', creator: { clerk_user_id: 'creator-1' } },
]
const validCampaign = {
  id: 'campaign-1',
  sponsor_id: 'sponsor-1',
  status: 'live',
  title: 'Test Campaign',
  stripe_charge_id: 'ch_test',
  payment_confirmed_at: TEN_DAYS_AGO,
  start_date: IN_8_DAYS,
  applications: acceptedApps,
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any)
  vi.mocked(prisma.sponsors.findUnique).mockResolvedValue(validSponsor as any)
  vi.mocked(prisma.campaigns.findUnique).mockResolvedValue(validCampaign as any)
  vi.mocked(prisma.campaigns.update).mockResolvedValue({} as any)
  vi.mocked(prisma.sanctioned_launch_requests.findUnique).mockResolvedValue(null)
  vi.mocked(prisma.sanctioned_launch_requests.create).mockResolvedValue({} as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('launchCampaign', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const res = await launchCampaign('campaign-1')
    expect(res.error).toBe('Not authenticated')
  })

  it('returns error when sponsor not found', async () => {
    vi.mocked(prisma.sponsors.findUnique).mockResolvedValue(null)
    const res = await launchCampaign('campaign-1')
    expect(res.error).toBe('Sponsor account not found.')
  })

  it('returns error when campaign is pending_payment', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ ...validCampaign, status: 'pending_payment' } as any)
    const res = await launchCampaign('campaign-1')
    expect(res.error).toMatch(/payment is required/i)
  })

  it('returns error when campaign is not live', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ ...validCampaign, status: 'draft' } as any)
    const res = await launchCampaign('campaign-1')
    expect(res.error).toMatch(/funded/i)
  })

  it('returns error when no stripe_charge_id', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ ...validCampaign, stripe_charge_id: null } as any)
    const res = await launchCampaign('campaign-1')
    expect(res.error).toMatch(/payment has not been confirmed/i)
  })

  it('returns error when no accepted creators', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ ...validCampaign, applications: [] } as any)
    const res = await launchCampaign('campaign-1')
    expect(res.error).toMatch(/accept at least one creator/i)
  })

  describe('sanctioned tier', () => {
    beforeEach(() => {
      vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ ...validSponsor, reputation_tier: 'sanctioned' } as any)
    })

    it('creates a launch request and returns pendingApproval on first attempt', async () => {
      const res = await launchCampaign('campaign-1')
      expect(prisma.sanctioned_launch_requests.create).toHaveBeenCalled()
      expect(res.success).toBe(true)
      expect(res.pendingApproval).toBe(true)
    })

    it('returns error when existing request is pending', async () => {
      vi.mocked(prisma.sanctioned_launch_requests.findUnique).mockResolvedValue({ verdict: 'pending' } as any)
      const res = await launchCampaign('campaign-1')
      expect(res.error).toMatch(/awaiting admin approval/i)
    })

    it('returns error when existing request is denied', async () => {
      vi.mocked(prisma.sanctioned_launch_requests.findUnique).mockResolvedValue({ verdict: 'denied' } as any)
      const res = await launchCampaign('campaign-1')
      expect(res.error).toMatch(/denied by an admin/i)
    })
  })

  describe('cooldown enforcement', () => {
    it('blocks launch when start_date is within cooldown window', async () => {
      vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({
        ...validCampaign,
        payment_confirmed_at: NOW,
        start_date: IN_1_DAY,
      } as any)
      const res = await launchCampaign('campaign-1')
      expect(res.error).toMatch(/7-day gap/i)
    })

    it('allows launch when start_date is outside cooldown window', async () => {
      vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({
        ...validCampaign,
        payment_confirmed_at: TEN_DAYS_AGO,
        start_date: IN_8_DAYS,
      } as any)
      const res = await launchCampaign('campaign-1')
      expect(res.success).toBe(true)
      expect(res.error).toBeUndefined()
    })

    it('verified tier has no cooldown even with tomorrow start date', async () => {
      vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ ...validSponsor, reputation_tier: 'verified' } as any)
      vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({
        ...validCampaign,
        payment_confirmed_at: NOW,
        start_date: IN_1_DAY,
      } as any)
      const res = await launchCampaign('campaign-1')
      expect(res.success).toBe(true)
    })
  })

  it('updates campaign to launched on success', async () => {
    await launchCampaign('campaign-1')
    expect(prisma.campaigns.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: { status: 'launched' },
    })
  })

  it('notifies each accepted creator on launch', async () => {
    await launchCampaign('campaign-1')
    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'creator-1', role: 'creator' }),
    )
  })
})
