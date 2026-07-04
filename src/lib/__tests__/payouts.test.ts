import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../prisma', () => ({
  prisma: {
    campaign_applications: { findUnique: vi.fn() },
    deal_submissions: { updateMany: vi.fn(), count: vi.fn() },
    campaigns: { update: vi.fn() },
  },
}))

vi.mock('../stripe', () => ({
  stripe: {
    transfers: { create: vi.fn() },
    paymentIntents: { retrieve: vi.fn(), search: vi.fn() },
  },
}))

vi.mock('../notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(null),
}))

vi.mock('../reputation', () => ({
  recordReputationEvent: vi.fn().mockResolvedValue({ delta: 0 }),
}))

import { prisma } from '../prisma'
import { stripe } from '../stripe'
import { createNotification } from '../notifications'
import { recordReputationEvent } from '../reputation'
import { settleCreatorPayout, initiateCreatorPayout } from '../payouts'

afterEach(() => {
  vi.clearAllMocks()
})

describe('settleCreatorPayout', () => {
  const settleApp = {
    campaign_id: 'campaign-1',
    creator_id: 'creator-1',
    campaign: { title: 'Test Campaign', sponsor_id: 'sponsor-1' },
    creator: { clerk_user_id: 'user-1' },
  }

  beforeEach(() => {
    vi.mocked(prisma.deal_submissions.updateMany).mockResolvedValue({ count: 1 } as any)
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(settleApp as any)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)
  })

  it('flips only settleable rows (null | processing) to paid', async () => {
    await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(prisma.deal_submissions.updateMany).toHaveBeenCalledWith({
      where: {
        application_id: 'app-1',
        OR: [{ payout_status: null }, { payout_status: 'processing' }],
      },
      data: { payout_status: 'paid', stripe_transfer_id: 'tr_1' },
    })
  })

  it('is a no-op with no consequences when the row is already settled (count 0)', async () => {
    vi.mocked(prisma.deal_submissions.updateMany).mockResolvedValue({ count: 0 } as any)
    const result = await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(result).toBe('noop')
    expect(createNotification).not.toHaveBeenCalled()
    expect(recordReputationEvent).not.toHaveBeenCalled()
  })

  it('notifies the creator, deduped on the transfer id', async () => {
    await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        role: 'creator',
        type: 'payout_sent',
        dedupeKey: 'tr_1',
      }),
    )
  })

  it('awards the creator completion bonus on a real transition', async () => {
    await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(recordReputationEvent).toHaveBeenCalledWith({ type: 'deal_completed', creatorId: 'creator-1' })
  })

  it('awards the sponsor rollup bonus when no unpaid submissions remain', async () => {
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)
    await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(recordReputationEvent).toHaveBeenCalledWith({ type: 'campaign_fully_paid', sponsorId: 'sponsor-1' })
  })

  it('does not award the sponsor rollup while unpaid submissions remain', async () => {
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(2)
    await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(recordReputationEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'campaign_fully_paid' }),
    )
  })

  it('marks paid but fires no consequences when the application is gone', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(null)
    const result = await settleCreatorPayout('app-1', { transferId: 'tr_1' })
    expect(result).toBe('settled')
    expect(createNotification).not.toHaveBeenCalled()
    expect(recordReputationEvent).not.toHaveBeenCalled()
  })
})

describe('initiateCreatorPayout', () => {
  // Superset shape satisfying both initiate's load and the settle load it triggers.
  const eligibleApp = {
    campaign_id: 'campaign-1',
    creator_id: 'creator-1',
    campaign: {
      id: 'campaign-1',
      budget: 1000,
      creator_count: 1,
      stripe_charge_id: 'ch_1',
      stripe_payment_intent_id: 'pi_1',
      title: 'Test Campaign',
      sponsor_id: 'sponsor-1',
    },
    creator: {
      stripe_connect_id: 'acct_1',
      stripe_onboarding_complete: true,
      clerk_user_id: 'user-1',
    },
    deal_submission: { status: 'approved', payout_status: null },
  }

  beforeEach(() => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue({ ...eligibleApp } as any)
    vi.mocked(prisma.deal_submissions.updateMany).mockResolvedValue({ count: 1 } as any)
    vi.mocked(prisma.deal_submissions.count).mockResolvedValue(0)
    vi.mocked(stripe.transfers.create).mockResolvedValue({ id: 'tr_new' } as any)
  })

  it('returns no_submission when the application/submission is missing', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(null)
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'no_submission' })
  })

  it('returns already_paid when payout_status is paid', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, deal_submission: { status: 'approved', payout_status: 'paid' } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'already_paid' })
  })

  it('returns in_progress when payout_status is processing', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, deal_submission: { status: 'approved', payout_status: 'processing' } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'in_progress' })
  })

  it('treats payout_failed as terminal (ineligible: already_failed)', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, deal_submission: { status: 'approved', payout_status: 'payout_failed' } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'already_failed' })
  })

  it('returns not_approved when the submission is not approved', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, deal_submission: { status: 'pending', payout_status: null } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'not_approved' })
  })

  it('returns creator_not_onboarded when Stripe onboarding is incomplete', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, creator: { stripe_connect_id: null, stripe_onboarding_complete: false } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'creator_not_onboarded' })
  })

  it('returns no_budget when the campaign has no budget', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, campaign: { ...eligibleApp.campaign, budget: null } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'no_budget' })
  })

  it('returns charge_unresolved when no settled charge can be located', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, campaign: { ...eligibleApp.campaign, stripe_charge_id: null, stripe_payment_intent_id: null } } as any,
    )
    vi.mocked(stripe.paymentIntents.search).mockResolvedValue({ data: [] } as any)
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'charge_unresolved' })
  })

  it('returns invalid_amount when the per-creator payout computes to zero/none', async () => {
    vi.mocked(prisma.campaign_applications.findUnique).mockResolvedValue(
      { ...eligibleApp, campaign: { ...eligibleApp.campaign, creator_count: null } } as any,
    )
    expect(await initiateCreatorPayout('app-1')).toEqual({ kind: 'ineligible', reason: 'invalid_amount' })
  })

  it('creates a Stripe transfer with the per-application idempotency key, then settles', async () => {
    const result = await initiateCreatorPayout('app-1')
    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 85000, // budget 1000 − 15% fee = 850 pool / 1 creator = 850 → cents
        destination: 'acct_1',
        source_transaction: 'ch_1',
        metadata: { applicationId: 'app-1', campaignId: 'campaign-1' },
      }),
      { idempotencyKey: 'transfer-app-1' },
    )
    expect(result).toEqual({ kind: 'paid', transferId: 'tr_new' })
    // The settle it triggered fired the completion bonus.
    expect(recordReputationEvent).toHaveBeenCalledWith({ type: 'deal_completed', creatorId: 'creator-1' })
  })

  it('returns in_progress when the atomic claim is lost to a concurrent caller', async () => {
    vi.mocked(prisma.deal_submissions.updateMany).mockResolvedValue({ count: 0 } as any)
    const result = await initiateCreatorPayout('app-1')
    expect(result).toEqual({ kind: 'in_progress' })
    expect(stripe.transfers.create).not.toHaveBeenCalled()
  })

  it('releases the claim and returns transfer_failed when Stripe throws', async () => {
    vi.mocked(stripe.transfers.create).mockRejectedValue(new Error('card_declined'))
    const result = await initiateCreatorPayout('app-1')
    expect(result).toEqual({ kind: 'transfer_failed', message: 'card_declined' })
    // Claim released back to null so a later retry can attempt again.
    expect(prisma.deal_submissions.updateMany).toHaveBeenLastCalledWith({
      where: { application_id: 'app-1', payout_status: 'processing' },
      data: { payout_status: null },
    })
  })
})
