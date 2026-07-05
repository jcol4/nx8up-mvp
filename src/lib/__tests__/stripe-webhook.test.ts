import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../prisma', () => ({
  prisma: {
    campaigns: { updateMany: vi.fn(), findUnique: vi.fn() },
    sponsors: { findUnique: vi.fn() },
    content_creators: { updateMany: vi.fn(), findFirst: vi.fn() },
    deal_submissions: { updateMany: vi.fn() },
  },
}))
vi.mock('../stripe', () => ({
  stripe: {
    invoiceItems: { create: vi.fn().mockResolvedValue({}) },
    invoices: {
      create: vi.fn().mockResolvedValue({ id: 'in_1' }),
      finalizeInvoice: vi.fn().mockResolvedValue({}),
      sendInvoice: vi.fn().mockResolvedValue({}),
      pay: vi.fn().mockResolvedValue({}),
    },
  },
}))
vi.mock('../notifications', () => ({ createNotification: vi.fn().mockResolvedValue(null) }))
vi.mock('../disputes', () => ({ onDisputeCreated: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../payouts', () => ({ settleCreatorPayout: vi.fn().mockResolvedValue('settled') }))
vi.mock('../constants', () => ({
  calcFeeBreakdown: () => ({ fee: 150, creatorPool: 850 }),
  NX_FEE_RATE: 0.15,
}))

import { prisma } from '../prisma'
import { stripe } from '../stripe'
import { createNotification } from '../notifications'
import { onDisputeCreated } from '../disputes'
import { settleCreatorPayout } from '../payouts'
import {
  handleStripeEvent,
  onPaymentIntentProcessing,
  onPaymentIntentSucceeded,
  onPaymentIntentFailed,
  onChargeSucceeded,
  onAccountUpdated,
} from '../stripe-webhook'

beforeEach(() => {
  vi.mocked(prisma.campaigns.updateMany).mockResolvedValue({ count: 1 } as any)
  vi.mocked(prisma.campaigns.findUnique).mockResolvedValue({ budget: 1000, creator_count: 1 } as any)
  vi.mocked(prisma.sponsors.findUnique).mockResolvedValue({ clerk_user_id: 'sponsor-user' } as any)
  vi.mocked(prisma.content_creators.updateMany).mockResolvedValue({ count: 1 } as any)
  vi.mocked(prisma.content_creators.findFirst).mockResolvedValue({ clerk_user_id: 'creator-user' } as any)
  vi.mocked(prisma.deal_submissions.updateMany).mockResolvedValue({ count: 1 } as any)
})

afterEach(() => vi.clearAllMocks())

describe('onPaymentIntentProcessing', () => {
  it('marks the campaign payment_in_progress', async () => {
    await onPaymentIntentProcessing({ id: 'pi_1', metadata: { campaignId: 'camp-1' } } as any)
    expect(prisma.campaigns.updateMany).toHaveBeenCalledWith({
      where: { id: 'camp-1', status: { in: ['pending_payment', 'payment_in_progress'] } },
      data: { status: 'payment_in_progress', stripe_payment_intent_id: 'pi_1' },
    })
  })

  it('is a no-op without a campaignId', async () => {
    await onPaymentIntentProcessing({ id: 'pi_1', metadata: {} } as any)
    expect(prisma.campaigns.updateMany).not.toHaveBeenCalled()
  })
})

describe('onPaymentIntentSucceeded', () => {
  const pi = {
    id: 'pi_1',
    metadata: { campaignId: 'camp-1', sponsorId: 'sp-1', campaignTitle: 'Launch' },
    latest_charge: 'ch_1',
    customer: 'cus_1',
  }

  it('advances the campaign to live and stores the charge id', async () => {
    await onPaymentIntentSucceeded(pi as any)
    expect(prisma.campaigns.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'camp-1', status: { in: ['pending_payment', 'payment_in_progress'] } },
        data: expect.objectContaining({ status: 'live', stripe_payment_intent_id: 'pi_1', stripe_charge_id: 'ch_1' }),
      }),
    )
  })

  it('notifies the sponsor, deduped on the payment intent id', async () => {
    await onPaymentIntentSucceeded(pi as any)
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'sponsor-user', type: 'payment_success', dedupeKey: 'pi_1' }),
    )
  })

  it('issues and pays out-of-band a campaign invoice when a customer is present', async () => {
    await onPaymentIntentSucceeded(pi as any)
    expect(stripe.invoiceItems.create).toHaveBeenCalledTimes(2)
    expect(stripe.invoices.create).toHaveBeenCalled()
    expect(stripe.invoices.pay).toHaveBeenCalledWith('in_1', { paid_out_of_band: true })
  })

  it('skips invoicing when the payment intent has no customer', async () => {
    await onPaymentIntentSucceeded({ ...pi, customer: null } as any)
    expect(stripe.invoices.create).not.toHaveBeenCalled()
  })

  it('is a no-op without a campaignId', async () => {
    await onPaymentIntentSucceeded({ id: 'pi_1', metadata: {} } as any)
    expect(prisma.campaigns.updateMany).not.toHaveBeenCalled()
  })

  it('does not fail the event when invoicing throws (campaign is already live)', async () => {
    vi.mocked(stripe.invoices.create).mockRejectedValueOnce(new Error('stripe down'))
    await expect(onPaymentIntentSucceeded(pi as any)).resolves.toBeUndefined()
    // The go-live update still happened before the invoice attempt.
    expect(prisma.campaigns.updateMany).toHaveBeenCalled()
  })
})

describe('onPaymentIntentFailed', () => {
  it('resets the campaign to pending_payment and notifies the sponsor', async () => {
    await onPaymentIntentFailed({ id: 'pi_1', metadata: { campaignId: 'camp-1', sponsorId: 'sp-1', campaignTitle: 'Launch' } } as any)
    expect(prisma.campaigns.updateMany).toHaveBeenCalledWith({
      where: { id: 'camp-1', stripe_payment_intent_id: 'pi_1' },
      data: { status: 'pending_payment', stripe_payment_intent_id: null, stripe_authorized_amount: null },
    })
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'payment_failed' }))
  })
})

describe('onChargeSucceeded', () => {
  it('stores the charge id and advances the campaign to live', async () => {
    await onChargeSucceeded({ id: 'ch_1', payment_intent: 'pi_1' } as any)
    expect(prisma.campaigns.updateMany).toHaveBeenCalledWith({
      where: { stripe_payment_intent_id: 'pi_1', stripe_charge_id: null },
      data: { stripe_charge_id: 'ch_1' },
    })
    expect(prisma.campaigns.updateMany).toHaveBeenCalledWith({
      where: { stripe_payment_intent_id: 'pi_1', status: { in: ['pending_payment', 'payment_in_progress'] } },
      data: { status: 'live', payment_confirmed_at: expect.any(Date) },
    })
  })

  it('is a no-op when the charge has no payment intent', async () => {
    await onChargeSucceeded({ id: 'ch_1', payment_intent: null } as any)
    expect(prisma.campaigns.updateMany).not.toHaveBeenCalled()
  })
})

describe('onAccountUpdated', () => {
  it('syncs stripe_onboarding_complete from charges_enabled', async () => {
    await onAccountUpdated({ id: 'acct_1', charges_enabled: true } as any)
    expect(prisma.content_creators.updateMany).toHaveBeenCalledWith({
      where: { stripe_connect_id: 'acct_1' },
      data: { stripe_onboarding_complete: true },
    })
  })
})

describe('handleStripeEvent dispatch', () => {
  it('routes transfer.created to settleCreatorPayout', async () => {
    await handleStripeEvent({ type: 'transfer.created', data: { object: { id: 'tr_1', metadata: { applicationId: 'app-1' } } } } as any)
    expect(settleCreatorPayout).toHaveBeenCalledWith('app-1', { transferId: 'tr_1' })
  })

  it('routes charge.dispute.created to onDisputeCreated', async () => {
    const dispute = { id: 'dp_1' }
    await handleStripeEvent({ type: 'charge.dispute.created', data: { object: dispute } } as any)
    expect(onDisputeCreated).toHaveBeenCalledWith(dispute)
  })

  it('routes payout.failed: marks submissions payout_failed and notifies the creator', async () => {
    await handleStripeEvent({
      type: 'payout.failed',
      account: 'acct_1',
      data: { object: { id: 'po_1', failure_code: 'x', failure_message: 'y' } },
    } as any)
    expect(prisma.deal_submissions.updateMany).toHaveBeenCalledWith({
      where: { payout_status: 'paid', application: { creator: { stripe_connect_id: 'acct_1' } } },
      data: { payout_status: 'payout_failed' },
    })
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'payout_failed', userId: 'creator-user' }))
  })

  it('payout.failed without a connected account is a no-op', async () => {
    await handleStripeEvent({ type: 'payout.failed', data: { object: { id: 'po_1' } } } as any)
    expect(prisma.deal_submissions.updateMany).not.toHaveBeenCalled()
  })

  it('ignores unhandled event types', async () => {
    await expect(handleStripeEvent({ type: 'customer.created', data: { object: {} } } as any)).resolves.toBeUndefined()
    expect(prisma.campaigns.updateMany).not.toHaveBeenCalled()
  })
})
