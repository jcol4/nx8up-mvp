/**
 * POST /api/stripe/webhook
 *
 * Receives and processes Stripe webhook events. Signature is verified against
 * STRIPE_WEBHOOK_SECRET before any processing occurs.
 *
 * Handled events:
 *  payment_intent.processing     — ACH submitted: marks campaign 'payment_in_progress'
 *  payment_intent.succeeded      — Payment confirmed: advances campaign to 'live',
 *                                   stores charge ID, notifies sponsor, sends invoice PDF
 *  payment_intent.payment_failed — Payment failed: resets campaign to 'pending_payment',
 *                                   notifies sponsor to retry
 *  charge.succeeded              — Backup charge capture for ACH timing edge cases where
 *                                   pi.latest_charge is null on payment_intent.succeeded
 *  account.updated               — Syncs stripe_onboarding_complete for Connect accounts
 *  transfer.created              — Confirms payout_status='paid', notifies creator
 *  payout.failed                 — Marks payout as failed, notifies creator to fix settings
 *
 * Always returns 200 { received: true } on success so Stripe stops retrying.
 */
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'
import type Stripe from 'stripe'

/** Verifies webhook signature and dispatches to per-event handlers. */
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.processing': {
        const pi = event.data.object as Stripe.PaymentIntent
        const campaignId = pi.metadata?.campaignId
        if (!campaignId) break

        // ACH / bank transfer submitted — mark campaign so sponsor sees "Payment Processing"
        await prisma.campaigns.updateMany({
          where: { id: campaignId, status: { in: ['pending_payment', 'payment_in_progress'] } },
          data: { status: 'payment_in_progress', stripe_payment_intent_id: pi.id },
        })
        console.log(`[webhook] payment_intent.processing — campaign ${campaignId} marked payment_in_progress`)
        break
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const campaignId = pi.metadata?.campaignId
        const sponsorId = pi.metadata?.sponsorId
        const campaignTitle = pi.metadata?.campaignTitle
        if (!campaignId) break

        // Get the charge ID from the PaymentIntent for use as source_transaction in transfers
        const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : (pi.latest_charge as Stripe.Charge | null)?.id ?? null

        // Advance from pending_payment or payment_in_progress → live
        const updated = await prisma.campaigns.updateMany({
          where: { id: campaignId, status: { in: ['pending_payment', 'payment_in_progress'] } },
          data: {
            status: 'live',
            stripe_payment_intent_id: pi.id,
            ...(chargeId ? { stripe_charge_id: chargeId } : {}),
          },
        })
        console.log(`[webhook] payment_intent.succeeded — campaign ${campaignId} status updated: ${updated.count} row(s) affected`)

        // Notify sponsor — use pi.id as dedupeKey so charge.succeeded + payment_intent.succeeded don't both fire
        if (sponsorId) {
          const sponsor = await prisma.sponsors.findUnique({
            where: { id: sponsorId },
            select: { clerk_user_id: true },
          })
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

        // Send invoice PDF to sponsor — create a finalized invoice and mark it paid out-of-band
        if (sponsorId && campaignTitle && pi.customer) {
          try {
            const campaign = await prisma.campaigns.findUnique({
              where: { id: campaignId },
              select: { budget: true, creator_count: true },
            })
            if (campaign?.budget) {
              const { calcFeeBreakdown } = await import('@/lib/constants')
              const { fee, creatorPool } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
              const customerId = typeof pi.customer === 'string' ? pi.customer : pi.customer.id

              await stripe.invoiceItems.create({ customer: customerId, amount: creatorPool * 100, currency: 'usd', description: `Creator payout pool — ${campaignTitle}` })
              await stripe.invoiceItems.create({ customer: customerId, amount: fee * 100, currency: 'usd', description: `nx8up platform fee (10%) — ${campaignTitle}` })

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
            }
          } catch (invoiceErr) {
            console.error('Failed to send invoice email after payment:', invoiceErr)
            // Non-fatal — campaign is already live
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const campaignId = pi.metadata?.campaignId
        const sponsorId = pi.metadata?.sponsorId
        const campaignTitle = pi.metadata?.campaignTitle
        if (!campaignId) break

        // Reset campaign so sponsor can retry — revert payment_in_progress back to pending_payment
        await prisma.campaigns.updateMany({
          where: { id: campaignId, stripe_payment_intent_id: pi.id },
          data: { status: 'pending_payment', stripe_payment_intent_id: null, stripe_authorized_amount: null },
        })

        if (sponsorId) {
          const sponsor = await prisma.sponsors.findUnique({
            where: { id: sponsorId },
            select: { clerk_user_id: true },
          })
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
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        const piId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null
        if (!piId) break

        console.log(`[webhook] charge.succeeded — piId=${piId} chargeId=${charge.id}`)

        // Ensure stripe_charge_id is always stored — pi.latest_charge can be null
        // on payment_intent.succeeded for ACH payments, so we capture it here too.
        const chargeStored = await prisma.campaigns.updateMany({
          where: { stripe_payment_intent_id: piId, stripe_charge_id: null },
          data: { stripe_charge_id: charge.id },
        })

        // Advance campaign to live if payment_intent.succeeded hasn't fired yet or
        // arrived without a charge (ACH timing edge case). Cover both pending_payment
        // (charge arrived before PI events) and payment_in_progress states.
        const chargeAdvanced = await prisma.campaigns.updateMany({
          where: {
            stripe_payment_intent_id: piId,
            status: { in: ['pending_payment', 'payment_in_progress'] },
          },
          data: { status: 'live' },
        })

        console.log(`[webhook] charge.succeeded — stored=${chargeStored.count} advanced=${chargeAdvanced.count}`)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await prisma.content_creators.updateMany({
          where: { stripe_connect_id: account.id },
          data: { stripe_onboarding_complete: account.charges_enabled },
        })
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        const applicationId = transfer.metadata?.applicationId
        if (!applicationId) break

        await prisma.deal_submissions.updateMany({
          where: { application_id: applicationId },
          data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
        })

        const app = await prisma.campaign_applications.findUnique({
          where: { id: applicationId },
          select: {
            campaign: { select: { title: true } },
            creator: { select: { clerk_user_id: true } },
          },
        })
        if (app) {
          await createNotification({
            userId: app.creator.clerk_user_id,
            role: 'creator',
            type: NOTIFICATION_TYPES.PAYOUT_SENT,
            title: 'Payout sent',
            message: `Your payout for "${app.campaign.title}" has been sent to your bank account.`,
            link: '/creator/campaigns',
            dedupeKey: transfer.id,
          })
        }
        break
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout
        const connectedAccountId = (event as unknown as { account?: string }).account
        console.error('[webhook] payout.failed', {
          payoutId: payout.id,
          connectedAccountId,
          failureCode: payout.failure_code,
          failureMessage: payout.failure_message,
        })
        if (connectedAccountId) {
          await prisma.deal_submissions.updateMany({
            where: {
              payout_status: 'paid',
              application: {
                creator: { stripe_connect_id: connectedAccountId },
              },
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
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
