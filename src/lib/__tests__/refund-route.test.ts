import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../app/api/stripe/refund/route'
import { prisma } from '../prisma'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('../prisma', () => ({
  prisma: {
    sponsors: { findUnique: vi.fn() },
    campaigns: { findUnique: vi.fn(), update: vi.fn() },
    deal_submissions: { count: vi.fn() },
    refund_requests: { create: vi.fn() },
  },
}))

vi.mock('../stripe', () => ({
  stripe: {
    refunds: { create: vi.fn() },
  },
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { stripe } from '../stripe'
import { createNotification } from '../notifications'

function makeRequest(body: object) {
  return new Request('http://localhost/api/stripe/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validSponsor = { id: 'sponsor-1', clerk_user_id: 'user-1' }
const validCampaign = {
  id: 'campaign-1',
  sponsor_id: 'sponsor-1',
  status: 'live',
  title: 'Test Campaign',
  stripe_payment_intent_id: 'pi_test',
  applications: [
    { id: 'app-1', status: 'accepted', creator: { clerk_user_id: 'creator-1' } },
    { id: 'app-2', status: 'pending', creator: { clerk_user_id: 'creator-2' } },
  ],
}

beforeEach(() => {
  vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any)
  vi.mocked(prisma.sponsors.findUnique).mockResolvedValue(validSponsor as any)
  vi.mocked(prisma.campaigns.findUnique).mockResolvedValue(validCampaign as any)
  vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)
  vi.mocked(prisma.campaigns.update).mockResolvedValue({} as any)
  vi.mocked(prisma.refund_requests.create).mockResolvedValue({} as any)
  vi.mocked(stripe.refunds.create).mockResolvedValue({ id: 're_test' } as any)
  vi.mocked(createNotification).mockResolvedValue(null)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/stripe/refund', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when campaignId is missing', async () => {
    const res = await POST(makeRequest({ reasonCategory: 'other' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when reasonCategory is missing', async () => {
    const res = await POST(makeRequest({ campaignId: 'campaign-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when sponsor not found', async () => {
    vi.mocked(prisma.sponsors.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(404)
  })

  it('returns 404 when campaign not found', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(404)
  })

  it('returns 400 when campaign is not live', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ ...validCampaign, status: 'launched' } as any)
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/live/i)
  })

  it('returns 400 when no payment intent', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ ...validCampaign, stripe_payment_intent_id: null } as any)
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when paid submissions exist', async () => {
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(1)
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/payouts/i)
  })

  it('returns 502 when Stripe refund fails', async () => {
    vi.mocked(stripe.refunds.create).mockRejectedValue(new Error('Stripe error'))
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(res.status).toBe(502)
  })

  it('happy path: refund issued, campaign cancelled, request created, creators notified', async () => {
    const res = await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'budget_constraints', reasonDetail: 'Over budget' }))
    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; refundId: string }
    expect(body.success).toBe(true)
    expect(body.refundId).toBe('re_test')

    expect(prisma.campaigns.update).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
      data: { status: 'cancelled' },
    })

    expect(prisma.refund_requests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          campaign_id: 'campaign-1',
          reason_category: 'budget_constraints',
          reason_detail: 'Over budget',
          verdict: 'pending',
        }),
      }),
    )

    expect(createNotification).toHaveBeenCalledTimes(2)
  })

  it('sets had_accepted_applications=true when accepted creators exist', async () => {
    await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(prisma.refund_requests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ had_accepted_applications: true }),
      }),
    )
  })

  it('sets had_accepted_applications=false when no accepted creators', async () => {
    vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({
      ...validCampaign,
      applications: [{ id: 'app-2', status: 'pending', creator: { clerk_user_id: 'creator-2' } }],
    } as any)
    await POST(makeRequest({ campaignId: 'campaign-1', reasonCategory: 'other' }))
    expect(prisma.refund_requests.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ had_accepted_applications: false }),
      }),
    )
  })
})
