/**
 * POST /api/stripe/payout
 * Body: { applicationId: string }
 *
 * Triggers a Stripe Connect transfer from the platform account to the creator's
 * Express account for an approved deal submission.
 *
 * Guards (in order):
 *  - Submission must be 'approved' and not already paid
 *  - Creator must have completed Stripe Express onboarding (charges_enabled)
 *  - Campaign must have a stripe_charge_id (funds collected)
 *  - payout_status is set to 'processing' atomically via updateMany to prevent
 *    double-payout races; if another request already claimed the slot, 409 is returned
 *
 * On Stripe error: resets payout_status to null so the caller can retry.
 * Returns: { success: true, transferId: string }
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { calcFeeBreakdown } from '@/lib/constants'

/** Executes a per-creator payout transfer for an approved campaign submission. */
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
  if (sub.payout_status === 'processing') return NextResponse.json({ error: 'Payout already in progress' }, { status: 409 })

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

  // Atomic race guard: claim the payout slot before calling Stripe
  const claimed = await prisma.deal_submissions.updateMany({
    where: { id: sub.id, payout_status: null },
    data: { payout_status: 'processing' },
  })
  if (claimed.count === 0) {
    return NextResponse.json({ error: 'Payout already in progress or completed' }, { status: 409 })
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: perCreator * 100,
        currency: 'usd',
        destination: creator.stripe_connect_id,
        source_transaction: campaign.stripe_charge_id,
        metadata: { applicationId, campaignId: campaign.id },
        description: `Payout for campaign: ${campaign.title}`,
      },
      { idempotencyKey: `transfer-${applicationId}` },
    )
    await prisma.deal_submissions.update({
      where: { application_id: applicationId },
      data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
    })
    return NextResponse.json({ success: true, transferId: transfer.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe transfer failed'
    console.error('[payout] transfer failed for application', applicationId, err)
    // Reset the guard so the caller can retry
    await prisma.deal_submissions.update({
      where: { application_id: applicationId },
      data: { payout_status: null },
    }).catch(() => {})
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
