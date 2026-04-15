import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { calcFeeBreakdown } from '@/lib/constants'
import SponsorHeader from '../../../SponsorHeader'
import PaymentForm from './PaymentForm'

// Stripe card payments cap at $999,999 — above that, ACH only
const CARD_MAX_BUDGET = 999_999

function resolvePaymentMethodTypes(budget: number): string[] {
  if (budget > CARD_MAX_BUDGET) return ['us_bank_account']
  return ['card', 'us_bank_account']
}

async function getOrCreatePaymentIntent(opts: {
  campaignId: string
  campaignTitle: string
  budget: number
  sponsorId: string
  sponsorEmail: string
  existingPiId: string | null
}): Promise<string> {
  const { campaignId, campaignTitle, budget, sponsorId, sponsorEmail, existingPiId } = opts
  const paymentMethodTypes = resolvePaymentMethodTypes(budget)

  // Re-use an existing open PI — update its payment_method_types to ensure all options are available
  if (existingPiId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(existingPiId)
      const isOpen = ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)
      if (isOpen && existing.client_secret) {
        // Ensure the PI has all the right payment method types (sponsor may want to switch)
        const currentTypes: string[] = (existing.payment_method_types as string[]) ?? []
        const needsUpdate = paymentMethodTypes.some(t => !currentTypes.includes(t))
        if (needsUpdate) {
          const updated = await stripe.paymentIntents.update(existingPiId, { payment_method_types: paymentMethodTypes })
          return updated.client_secret!
        }
        return existing.client_secret
      }
    } catch {
      // fall through
    }
  }

  // Get or create a Stripe Customer for this sponsor
  const sponsorRecord = await prisma.sponsors.findUnique({
    where: { id: sponsorId },
    select: { stripe_customer_id: true },
  })

  let customerId = sponsorRecord?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: sponsorEmail,
      metadata: { sponsorId },
    })
    customerId = customer.id
    await prisma.sponsors.update({
      where: { id: sponsorId },
      data: { stripe_customer_id: customerId },
    })
  }

  const pi = await stripe.paymentIntents.create({
    amount: budget * 100,
    currency: 'usd',
    customer: customerId,
    payment_method_types: paymentMethodTypes,
    metadata: { campaignId, sponsorId, campaignTitle },
    description: `Campaign funding: ${campaignTitle}`,
    receipt_email: sponsorEmail,
  })

  // Store on campaign
  await prisma.campaigns.update({
    where: { id: campaignId },
    data: {
      stripe_payment_intent_id: pi.id,
      stripe_authorized_amount: budget,
    },
  })

  if (!pi.client_secret) throw new Error('PaymentIntent has no client_secret')
  return pi.client_secret
}

export default async function CampaignPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, email: true },
  })
  if (!sponsor) redirect('/')

  const { id: campaignId } = await params
  const { redirect_status, payment_intent: piId } = await searchParams

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      title: true,
      status: true,
      budget: true,
      creator_count: true,
      sponsor_id: true,
      stripe_payment_intent_id: true,
      preferred_payment_method: true,
    },
  })

  if (!campaign || campaign.sponsor_id !== sponsor.id) notFound()

  // Stripe redirected back after payment attempt
  if (piId && (redirect_status === 'succeeded' || redirect_status === 'processing')) {
    if (redirect_status === 'processing') {
      // ACH initiated — mark campaign as payment_in_progress so sponsor sees the right status
      await prisma.campaigns.updateMany({
        where: { id: campaignId, status: { in: ['pending_payment', 'payment_in_progress'] } },
        data: { status: 'payment_in_progress', stripe_payment_intent_id: piId },
      })
      redirect('/sponsor/campaigns?payment=processing')
    }

    const pi = await stripe.paymentIntents.retrieve(piId)
    if (pi.status === 'succeeded') {
      const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : (pi.latest_charge as Stripe.Charge | null)?.id ?? null
      if (campaign.status === 'pending_payment') {
        await prisma.campaigns.update({
          where: { id: campaignId },
          data: {
            status: 'live',
            stripe_payment_intent_id: piId,
            ...(chargeId ? { stripe_charge_id: chargeId } : {}),
          },
        })
      }
      redirect('/sponsor/campaigns')
    }
  }

  if (campaign.status === 'live' || campaign.status === 'launched') {
    redirect('/sponsor/campaigns')
  }
  if (campaign.status === 'payment_in_progress') {
    redirect('/sponsor/campaigns?payment=processing')
  }
  if (campaign.status !== 'pending_payment') {
    redirect('/sponsor/campaigns')
  }
  if (!campaign.budget || campaign.budget <= 0) {
    redirect('/sponsor/campaigns')
  }

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const returnUrl = `${proto}://${host}/sponsor/campaigns/${campaignId}/pay`

  const { fee, creatorPool, perCreator } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
  const largeBudget = campaign.budget > 999_999

  const clientSecret = await getOrCreatePaymentIntent({
    campaignId,
    campaignTitle: campaign.title,
    budget: campaign.budget,
    sponsorId: sponsor.id,
    sponsorEmail: sponsor.email,
    existingPiId: campaign.stripe_payment_intent_id ?? null,
  })

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-lg mx-auto space-y-6">
          <Link
            href="/sponsor/campaigns"
            className="inline-flex items-center gap-1.5 text-xs dash-text-muted hover:text-[#c8dff0] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to campaigns
          </Link>

          <div>
            <h1 className="text-xl font-bold dash-text-bright">Fund Campaign</h1>
            <p className="text-sm dash-text-muted mt-1">{campaign.title}</p>
            <p className="text-xs dash-text-muted mt-0.5">
              An invoice will be emailed to <span className="dash-text">{sponsor.email}</span> once payment is confirmed.
            </p>
          </div>

          {/* Fee breakdown */}
          <div className="dash-panel p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="dash-text-muted">Creator payout pool</span>
              <span className="text-[#22c55e] font-semibold">${creatorPool.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="dash-text-muted">nx8up platform fee (10%)</span>
              <span className="text-red-400/70">${fee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-white/10 pt-2">
              <span className="dash-text-muted">Total due</span>
              <span className="dash-text-bright">${campaign.budget.toLocaleString()}</span>
            </div>
            {perCreator && (
              <p className="text-xs dash-text-muted pt-1 border-t border-white/5">
                ≈ <span className="text-[#22c55e] font-medium">${perCreator.toLocaleString()}</span> per creator ({campaign.creator_count} creators)
              </p>
            )}
          </div>

          <PaymentForm
            clientSecret={clientSecret}
            campaignTitle={campaign.title}
            budgetDisplay={`$${campaign.budget.toLocaleString()}`}
            returnUrl={returnUrl}
            largeBudget={largeBudget}
          />
        </div>
      </div>
    </>
  )
}
