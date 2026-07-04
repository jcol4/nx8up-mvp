import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../../app/api/stripe/webhook/route'

vi.mock('../prisma', () => ({
  prisma: {
    campaigns: { updateMany: vi.fn() },
    campaign_applications: { findUnique: vi.fn(), updateMany: vi.fn() },
    deal_submissions: { updateMany: vi.fn(), count: vi.fn() },
    content_creators: { findFirst: vi.fn(), updateMany: vi.fn() },
    sponsors: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('../stripe', () => ({
  stripe: { webhooks: { constructEvent: vi.fn() } },
}))

// The transfer.created branch now delegates to the payout module; the settlement
// logic (idempotent flip + notification + reputation) is covered in payouts.test.ts.
vi.mock('../payouts', () => ({
  settleCreatorPayout: vi.fn().mockResolvedValue('settled'),
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

vi.mock('../disputes', () => ({
  onDisputeCreated: vi.fn(),
}))

import { stripe } from '../stripe'
import { settleCreatorPayout } from '../payouts'

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

beforeEach(() => {
  vi.mocked(stripe.webhooks.constructEvent).mockImplementation((_body, _sig, _secret) => {
    return JSON.parse(_body as string)
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('webhook transfer.created adapter', () => {
  it('does nothing when applicationId is missing from metadata', async () => {
    const res = await POST(makeWebhookRequest(makeTransferEvent(null)))
    expect(res.status).toBe(200)
    expect(settleCreatorPayout).not.toHaveBeenCalled()
  })

  it('delegates to settleCreatorPayout with the transfer id', async () => {
    const res = await POST(makeWebhookRequest(makeTransferEvent('app-1')))
    expect(res.status).toBe(200)
    expect(settleCreatorPayout).toHaveBeenCalledWith('app-1', { transferId: 'tr_test' })
  })
})
