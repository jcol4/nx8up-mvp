import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { BUDGET_MAX } from '@/lib/constants'

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
  if (campaign.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Campaign is not awaiting payment' }, { status: 400 })
  }
  if (!campaign.budget || campaign.budget <= 0) {
    return NextResponse.json({ error: 'Campaign budget is missing' }, { status: 400 })
  }
  if (campaign.budget > BUDGET_MAX) {
    return NextResponse.json(
      { error: `Budget of $${campaign.budget.toLocaleString()} exceeds the $${BUDGET_MAX.toLocaleString()} maximum — contact support to process large campaigns.` },
      { status: 422 },
    )
  }

  // Re-use an existing pending PaymentIntent if we already created one
  if (campaign.stripe_payment_intent_id) {
    try {
      const existing = await stripe.paymentIntents.retrieve(campaign.stripe_payment_intent_id)
      if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation' || existing.status === 'requires_action') {
        return NextResponse.json({ clientSecret: existing.client_secret })
      }
      // Succeeded or cancelled — fall through to create a new one if needed
      if (existing.status === 'succeeded') {
        return NextResponse.json({ error: 'Already paid' }, { status: 400 })
      }
    } catch {
      // PI not found, create a new one
    }
  }

  const amountCents = campaign.budget * 100

  // Idempotency key ensures a network timeout on first creation doesn't produce
  // a duplicate PI — retrying returns the already-created object instead.
  // Only set on first creation (no existing PI); if we're replacing a cancelled
  // PI the key would be stale, so we omit it and let Stripe create fresh.
  const piIdempotencyKey = !campaign.stripe_payment_intent_id
    ? { idempotencyKey: `pi-${campaign.id}` }
    : undefined

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: amountCents,
      currency: 'usd',
      payment_method_types: ['card', 'us_bank_account'],
      metadata: {
        campaignId: campaign.id,
        sponsorId: sponsor.id,
      },
      description: `Campaign: ${campaign.title}`,
    },
    piIdempotencyKey,
  )

  await prisma.campaigns.update({
    where: { id: campaign.id },
    data: {
      stripe_payment_intent_id: paymentIntent.id,
      stripe_authorized_amount: campaign.budget,
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
