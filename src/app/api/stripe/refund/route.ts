/**
 * POST /api/stripe/refund
 * Body: { campaignId: string }
 *
 * Issues a full refund on the campaign's PaymentIntent and cancels the campaign.
 * Blocked if any submissions have already been paid out — partial refunds are
 * not supported and must be handled manually via the Stripe dashboard.
 *
 * Returns: { success: true, refundId: string }
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

/** Refunds the campaign budget in full and sets campaign status to 'cancelled'. */
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await request.json()
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 })

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  const campaign = await prisma.campaigns.findUnique({ where: { id: campaignId } })
  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (!campaign.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'No payment found for this campaign' }, { status: 400 })
  }

  // Check that no submissions have already been paid out
  const paidSubmissions = await prisma.deal_submissions.count({
    where: {
      payout_status: 'paid',
      application: { campaign_id: campaignId },
    },
  })
  if (paidSubmissions > 0) {
    return NextResponse.json(
      { error: 'Cannot refund — payouts have already been issued for this campaign' },
      { status: 400 },
    )
  }

  const refund = await stripe.refunds.create({
    payment_intent: campaign.stripe_payment_intent_id,
  })

  await prisma.campaigns.update({
    where: { id: campaignId },
    data: { status: 'cancelled' },
  })

  return NextResponse.json({ success: true, refundId: refund.id })
}
