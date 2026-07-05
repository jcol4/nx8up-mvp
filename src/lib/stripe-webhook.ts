/**
 * Stripe webhook event handling — the domain logic behind `POST /api/stripe/webhook`.
 *
 * The route is a thin adapter: it verifies the Stripe signature (the webhook's only
 * authentication) and hands the *already-verified* event to `handleStripeEvent`. Every
 * per-event handler lives here as a named function over the parsed Stripe object, so the
 * money-critical paths — campaign go-live, invoicing, payout-failure — are unit-testable
 * without constructing HTTP requests or forging signatures. Handlers assume the event is
 * authentic (mirrors the payout seam: auth lives in the adapter, not the core).
 *
 * `transfer.created` and `charge.dispute.created` delegate to their own modules
 * (`settleCreatorPayout`, `onDisputeCreated`); the rest are handled below.
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'
import { onDisputeCreated } from '@/lib/disputes'
import { settleCreatorPayout } from '@/lib/payouts'
import type Stripe from 'stripe'

/**
 * Dispatches a verified Stripe event to its handler. Unknown event types are ignored
 * (the route still acks them with 200 so Stripe stops retrying).
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.processing':
      return onPaymentIntentProcessing(event.data.object as Stripe.PaymentIntent)
    case 'payment_intent.succeeded':
      return onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
    case 'payment_intent.payment_failed':
      return onPaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
    case 'charge.succeeded':
      return onChargeSucceeded(event.data.object as Stripe.Charge)
    case 'account.updated':
      return onAccountUpdated(event.data.object as Stripe.Account)
    case 'transfer.created':
      return onTransferCreated(event.data.object as Stripe.Transfer)
    case 'charge.dispute.created':
      return onChargeDisputeCreated(event.data.object as Stripe.Dispute)
    case 'payout.failed':
      return onPayoutFailed(event)
  }
}

/** ACH / bank transfer submitted — mark the campaign so the sponsor sees "Payment Processing". */
export async function onPaymentIntentProcessing(pi: Stripe.PaymentIntent): Promise<void> {
  const campaignId = pi.metadata?.campaignId
  if (!campaignId) return

  await prisma.campaigns.updateMany({
    where: { id: campaignId, status: { in: ['pending_payment', 'payment_in_progress'] } },
    data: { status: 'payment_in_progress', stripe_payment_intent_id: pi.id },
  })
  console.log(`[webhook] payment_intent.processing — campaign ${campaignId} marked payment_in_progress`)
}

/** Payment confirmed — advance the campaign to `live`, store the charge, notify + invoice the sponsor. */
export async function onPaymentIntentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const campaignId = pi.metadata?.campaignId
  const sponsorId = pi.metadata?.sponsorId
  const campaignTitle = pi.metadata?.campaignTitle
  if (!campaignId) return

  // Charge ID becomes source_transaction for creator transfers.
  const chargeId =
    typeof pi.latest_charge === 'string' ? pi.latest_charge : (pi.latest_charge as Stripe.Charge | null)?.id ?? null

  const updated = await prisma.campaigns.updateMany({
    where: { id: campaignId, status: { in: ['pending_payment', 'payment_in_progress'] } },
    data: {
      status: 'live',
      stripe_payment_intent_id: pi.id,
      payment_confirmed_at: new Date(),
      ...(chargeId ? { stripe_charge_id: chargeId } : {}),
    },
  })
  console.log(`[webhook] payment_intent.succeeded — campaign ${campaignId} status updated: ${updated.count} row(s) affected`)

  // Notify sponsor — dedupe on pi.id so charge.succeeded + payment_intent.succeeded don't both fire.
  if (sponsorId) {
    const sponsor = await prisma.sponsors.findUnique({ where: { id: sponsorId }, select: { clerk_user_id: true } })
    if (sponsor) {
      await createNotification({
        userId: sponsor.clerk_user_id,
        role: 'sponsor',
        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        title: 'Payment confirmed',
        message: `Your campaign "${campaignTitle ?? 'campaign'}" is now live.`,
        link: `/sponsor/campaigns`,
        dedupeKey: pi.id,
      })
    }
  }

  await sendCampaignInvoice(pi, { campaignId, sponsorId, campaignTitle })
}

/**
 * Creates a finalized invoice for a confirmed campaign payment and marks it paid out-of-band,
 * so the sponsor receives an invoice PDF. Non-fatal — the campaign is already live; a failure
 * here is logged and swallowed. No-op unless the sponsor, title, and customer are all known.
 */
async function sendCampaignInvoice(
  pi: Stripe.PaymentIntent,
  { campaignId, sponsorId, campaignTitle }: { campaignId: string; sponsorId?: string; campaignTitle?: string },
): Promise<void> {
  if (!sponsorId || !campaignTitle || !pi.customer) return

  try {
    const campaign = await prisma.campaigns.findUnique({
      where: { id: campaignId },
      select: { budget: true, creator_count: true },
    })
    if (!campaign?.budget) return

    const { calcFeeBreakdown, NX_FEE_RATE } = await import('@/lib/constants')
    const { fee, creatorPool } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
    const customerId = typeof pi.customer === 'string' ? pi.customer : pi.customer.id

    await stripe.invoiceItems.create({ customer: customerId, amount: creatorPool * 100, currency: 'usd', description: `Creator payout pool — ${campaignTitle}` })
    await stripe.invoiceItems.create({ customer: customerId, amount: fee * 100, currency: 'usd', description: `nx8up platform fee (${Math.round(NX_FEE_RATE * 100)}%) — ${campaignTitle}` })

    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 0,
      auto_advance: false,
      metadata: { campaignId, sponsorId },
      description: `Campaign funding: ${campaignTitle}`,
      footer: `Total campaign budget: $${campaign.budget.toLocaleString()}`,
    })
    await stripe.invoices.finalizeInvoice(invoice.id, { auto_advance: false })
    await stripe.invoices.sendInvoice(invoice.id)
    await stripe.invoices.pay(invoice.id, { paid_out_of_band: true })
  } catch (invoiceErr) {
    console.error('Failed to send invoice email after payment:', invoiceErr)
    // Non-fatal — campaign is already live.
  }
}

/** Payment failed — reset the campaign to `pending_payment` so the sponsor can retry, and notify them. */
export async function onPaymentIntentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const campaignId = pi.metadata?.campaignId
  const sponsorId = pi.metadata?.sponsorId
  const campaignTitle = pi.metadata?.campaignTitle
  if (!campaignId) return

  await prisma.campaigns.updateMany({
    where: { id: campaignId, stripe_payment_intent_id: pi.id },
    data: { status: 'pending_payment', stripe_payment_intent_id: null, stripe_authorized_amount: null },
  })

  if (sponsorId) {
    const sponsor = await prisma.sponsors.findUnique({ where: { id: sponsorId }, select: { clerk_user_id: true } })
    if (sponsor) {
      await createNotification({
        userId: sponsor.clerk_user_id,
        role: 'sponsor',
        type: NOTIFICATION_TYPES.PAYMENT_FAILED,
        title: 'Payment failed',
        message: `Payment for "${campaignTitle ?? 'your campaign'}" could not be processed. Please retry.`,
        link: `/sponsor/campaigns`,
      })
    }
  }
}

/**
 * Backup charge capture. `pi.latest_charge` can be null on `payment_intent.succeeded` for ACH,
 * so store the charge id here too, and advance to `live` if the PI events haven't already.
 */
export async function onChargeSucceeded(charge: Stripe.Charge): Promise<void> {
  const piId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null
  if (!piId) return

  console.log(`[webhook] charge.succeeded — piId=${piId} chargeId=${charge.id}`)

  const chargeStored = await prisma.campaigns.updateMany({
    where: { stripe_payment_intent_id: piId, stripe_charge_id: null },
    data: { stripe_charge_id: charge.id },
  })

  const chargeAdvanced = await prisma.campaigns.updateMany({
    where: { stripe_payment_intent_id: piId, status: { in: ['pending_payment', 'payment_in_progress'] } },
    data: { status: 'live', payment_confirmed_at: new Date() },
  })

  console.log(`[webhook] charge.succeeded — stored=${chargeStored.count} advanced=${chargeAdvanced.count}`)
}

/** Syncs `stripe_onboarding_complete` for a Connect account as its capabilities change. */
export async function onAccountUpdated(account: Stripe.Account): Promise<void> {
  await prisma.content_creators.updateMany({
    where: { stripe_connect_id: account.id },
    data: { stripe_onboarding_complete: account.charges_enabled },
  })
}

/**
 * Idempotent payout confirmation. The synchronous payout path usually settles first; this is
 * the safety net. `settleCreatorPayout` fires the paid-transition consequences exactly once.
 */
export async function onTransferCreated(transfer: Stripe.Transfer): Promise<void> {
  const applicationId = transfer.metadata?.applicationId
  if (!applicationId) return
  await settleCreatorPayout(applicationId, { transferId: transfer.id })
}

/** Opens a dispute record (+ audit log) for admin handling. */
export async function onChargeDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  await onDisputeCreated(dispute)
}

/**
 * A creator's bank payout bounced. Mark their paid submissions `payout_failed` (terminal —
 * see issue #6) and notify them to fix their Stripe payout settings.
 */
export async function onPayoutFailed(event: Stripe.Event): Promise<void> {
  const payout = event.data.object as Stripe.Payout
  const connectedAccountId = (event as unknown as { account?: string }).account
  console.error('[webhook] payout.failed', {
    payoutId: payout.id,
    connectedAccountId,
    failureCode: payout.failure_code,
    failureMessage: payout.failure_message,
  })
  if (!connectedAccountId) return

  await prisma.deal_submissions.updateMany({
    where: {
      payout_status: 'paid',
      application: { creator: { stripe_connect_id: connectedAccountId } },
    },
    data: { payout_status: 'payout_failed' },
  })

  const creator = await prisma.content_creators.findFirst({
    where: { stripe_connect_id: connectedAccountId },
    select: { clerk_user_id: true },
  })
  if (creator) {
    await createNotification({
      userId: creator.clerk_user_id,
      role: 'creator',
      type: NOTIFICATION_TYPES.PAYOUT_FAILED,
      title: 'Payout failed',
      message: `A payout to your bank account failed. Please check your Stripe payout settings.`,
      link: '/creator/profile',
    })
  }
}
