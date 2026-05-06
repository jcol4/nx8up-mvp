/**
 * POST /api/stripe/refund
 * Body: { campaignId, reasonCategory, reasonDetail? }
 *
 * Issues a full Stripe refund immediately and creates a refund_request record
 * for admin review. The admin verdict later adjusts the sponsor's reputation
 * score asynchronously. Blocked if the campaign has already launched.
 *
 * Returns: { success: true, refundId: string }
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId, reasonCategory, reasonDetail } = await request.json()
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
  if (!reasonCategory) return NextResponse.json({ error: 'reasonCategory required' }, { status: 400 })

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    include: {
      applications: {
        where: { status: { in: ['pending', 'accepted'] } },
        select: { id: true, status: true, creator: { select: { clerk_user_id: true } } },
      },
    },
  })
  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }
  if (campaign.status !== 'live') {
    return NextResponse.json(
      { error: 'Refunds can only be requested for active (live) campaigns that have not yet launched.' },
      { status: 400 },
    )
  }
  if (!campaign.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'No payment found for this campaign' }, { status: 400 })
  }

  const paidSubmissions = await prisma.deal_submissions.count({
    where: { payout_status: 'paid', application: { campaign_id: campaignId } },
  })
  if (paidSubmissions > 0) {
    return NextResponse.json(
      { error: 'Cannot refund — payouts have already been issued for this campaign' },
      { status: 400 },
    )
  }

  const hadAcceptedApplications = campaign.applications.some((a) => a.status === 'accepted')

  let refund
  try {
    refund = await stripe.refunds.create({ payment_intent: campaign.stripe_payment_intent_id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe refund failed'
    console.error('stripe.refunds.create failed:', err)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  await prisma.campaigns.update({
    where: { id: campaignId },
    data: { status: 'cancelled' },
  })

  await prisma.refund_requests.create({
    data: {
      campaign_id: campaignId,
      sponsor_id: sponsor.id,
      reason_category: reasonCategory,
      reason_detail: reasonDetail || null,
      had_accepted_applications: hadAcceptedApplications,
      verdict: 'pending',
    },
  })

  // Notify accepted and pending creators that the campaign was cancelled
  await Promise.all(
    campaign.applications.map((app) =>
      createNotification({
        userId: app.creator.clerk_user_id,
        role: 'creator',
        type: NOTIFICATION_TYPES.CAMPAIGN_CANCELLED_CREATOR,
        title: 'Campaign cancelled',
        message: `"${campaign.title}" has been cancelled by the sponsor. Your application has been closed.`,
        link: '/creator/campaigns',
      }),
    ),
  )

  return NextResponse.json({ success: true, refundId: refund.id })
}
