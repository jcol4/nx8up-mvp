import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'


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
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const campaignId = pi.metadata?.campaignId
        const sponsorId = pi.metadata?.sponsorId
        const campaignTitle = pi.metadata?.campaignTitle
        if (!campaignId) break

        // Get the charge ID from the PaymentIntent for use as source_transaction in transfers
        const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : (pi.latest_charge as Stripe.Charge | null)?.id ?? null

        // Only advance from pending_payment → live; never downgrade launched/cancelled campaigns
        // Note: don't filter by stripe_payment_intent_id — in dev the page can render twice,
        // creating two PIs; the DB may store the second while payment succeeds on the first.
        const updated = await prisma.campaigns.updateMany({
          where: { id: campaignId, status: 'pending_payment' },
          data: {
            status: 'live',
            stripe_payment_intent_id: pi.id,
            ...(chargeId ? { stripe_charge_id: chargeId } : {}),
          },
        })
        console.log(`[webhook] payment_intent.succeeded — campaign ${campaignId} status updated: ${updated.count} row(s) affected`)

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
              await stripe.invoices.pay(invoice.id, { paid_out_of_band: true })
              await stripe.invoices.sendInvoice(invoice.id)
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
        if (!campaignId) break

        // Reset campaign payment intent so sponsor can retry
        await prisma.campaigns.updateMany({
          where: { id: campaignId, stripe_payment_intent_id: pi.id },
          data: { stripe_payment_intent_id: null, stripe_authorized_amount: null },
        })
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        if (account.charges_enabled) {
          await prisma.content_creators.updateMany({
            where: { stripe_connect_id: account.id },
            data: { stripe_onboarding_complete: true },
          })
        }
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        // transfer.metadata.applicationId is set when we create the transfer
        const applicationId = transfer.metadata?.applicationId
        if (!applicationId) break

        await prisma.deal_submissions.updateMany({
          where: { application_id: applicationId },
          data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
        })
        break
      }

      case 'payout.failed': {
        // A payout from Stripe to the creator's bank failed
        // The transfer.destination is the connected account ID
        const payout = event.data.object as Stripe.Payout
        // We can't easily tie this back to a specific application without more metadata
        // Log it — in production you'd notify the creator
        console.error('Payout failed for account, payout id:', payout.id)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
