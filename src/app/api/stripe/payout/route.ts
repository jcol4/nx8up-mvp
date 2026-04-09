import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { calcFeeBreakdown } from '@/lib/constants'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId } = await request.json()
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  const application = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: {
        select: {
          id: true,
          sponsor_id: true,
          budget: true,
          creator_count: true,
          stripe_charge_id: true,
          stripe_payment_intent_id: true,
          title: true,
        },
      },
      creator: {
        select: { id: true, stripe_connect_id: true, stripe_onboarding_complete: true },
      },
      deal_submission: {
        select: { id: true, status: true, payout_status: true },
      },
    },
  })

  if (!application || application.campaign.sponsor_id !== sponsor.id) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const { campaign, creator, deal_submission: sub } = application

  if (!sub) return NextResponse.json({ error: 'No submission found' }, { status: 400 })
  if (sub.status !== 'approved') return NextResponse.json({ error: 'Submission not approved' }, { status: 400 })
  if (sub.payout_status === 'paid') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

  if (!creator.stripe_connect_id || !creator.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Creator has not completed Stripe onboarding' }, { status: 400 })
  }

  if (!campaign.budget) return NextResponse.json({ error: 'Campaign has no budget' }, { status: 400 })
  if (!campaign.stripe_charge_id) {
    return NextResponse.json({ error: 'Campaign payment not found — funds must be collected before payout' }, { status: 400 })
  }

  const { perCreator } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
  if (!perCreator || perCreator <= 0) {
    return NextResponse.json({ error: 'Could not calculate payout amount' }, { status: 400 })
  }

  const amountCents = perCreator * 100

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: 'usd',
    destination: creator.stripe_connect_id,
    source_transaction: campaign.stripe_charge_id,
    metadata: { applicationId, campaignId: campaign.id },
    description: `Payout for campaign: ${campaign.title}`,
  })

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
  })

  return NextResponse.json({ success: true, transferId: transfer.id })
}
