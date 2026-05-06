import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../app/api/stripe/webhook/route'
import { prisma } from '../prisma'

vi.mock('../prisma', () => ({
  prisma: {
    campaigns: { updateMany: vi.fn() },
    campaign_applications: { findUnique: vi.fn(), updateMany: vi.fn() },
    deal_submissions: { updateMany: vi.fn(), count: vi.fn() },
    content_creators: { findFirst: vi.fn(), updateMany: vi.fn() },
    sponsors: { findUnique: vi.fn(), update: vi.fn() },
    campaigns_updateMany: vi.fn(),
  },
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

vi.mock('../stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock('../reputation', () => ({
  adjustSponsorReputation: vi.fn().mockResolvedValue(undefined),
  adjustCreatorReputation: vi.fn().mockResolvedValue(undefined),
  COMPLETION_BONUS: 5,
}))

vi.mock('../disputes', () => ({
  onDisputeCreated: vi.fn(),
}))

import { stripe } from '../stripe'
import { createNotification } from '../notifications'
import { adjustSponsorReputation, adjustCreatorReputation } from '../reputation'

const WEBHOOK_SECRET = 'whsec_test'
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET

function makeWebhookRequest(event: object) {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body: JSON.stringify(event),
  })
}

function makeTransferEvent(applicationId: string | null, overrides = {}) {
  return {
    type: 'transfer.created',
    data: {
      object: {
        id: 'tr_test',
        metadata: applicationId ? { applicationId } : {},
        ...overrides,
      },
    },
  }
}

const validApp = {
  id: 'app-1',
  campaign_id: 'campaign-1',
  creator_id: 'creator-1',
  campaign: { title: 'Test Campaign', sponsor_id: 'sponsor-1' },
  creator: { clerk_user_id: 'creator-1' },
}

beforeEach(() => {
  vi.mocked(stripe.webhooks.constructEvent).mockImplementation((_body, _sig, _secret) => {
    return JSON.parse(_body as string)
  })
  vi.mocked(prisma.deal_submissions.updateMany).mockResolvedValue({ count: 1 } as any)
  vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(validApp as any)
  vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)
  vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ id: 'sponsor-1', clerk_user_id: 'user-1' } as any)
  vi.mocked(prisma.campaigns.updateMany).mockResolvedValue({ count: 0 } as any)
  vi.mocked(prisma.content_creators.findFirst).mockResolvedValue(null)
  vi.mocked(prisma.content_creators.updateMany).mockResolvedValue({ count: 0 } as any)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('webhook transfer.created handler', () => {
  it('does nothing when applicationId is missing from metadata', async () => {
    const res = await POST(makeWebhookRequest(makeTransferEvent(null)))
    expect(res.status).toBe(200)
    expect(prisma.deal_submissions.updateMany).not.toHaveBeenCalled()
    expect(createNotification).not.toHaveBeenCalled()
  })

  it('marks deal submission as paid', async () => {
    await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(prisma.deal_submissions.updateMany).toHaveBeenCalledWith({
      where: { application_id: 'app-1' },
      data: { stripe_transfer_id: 'tr_test', payout_status: 'paid' },
    })
  })

  it('notifies creator with payout_sent type', async () => {
    await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'creator-1',
        role: 'creator',
        type: 'payout_sent',
      }),
    )
  })

  it('does NOT call adjustSponsorReputation when unpaid submissions remain', async () => {
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(2)
    await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(adjustSponsorReputation).not.toHaveBeenCalled()
  })

  it('calls adjustSponsorReputation(sponsorId, 3) when all creators are paid', async () => {
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)
    await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(adjustSponsorReputation).toHaveBeenCalledWith('sponsor-1', 3)
  })

  it('awards creator +5 reputation on payout (COMPLETION_BONUS)', async () => {
    await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(adjustCreatorReputation).toHaveBeenCalledWith('creator-1', 5)
  })

  it('does not award completion bonus when application not found', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(null)
    await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(adjustCreatorReputation).not.toHaveBeenCalled()
  })
})
