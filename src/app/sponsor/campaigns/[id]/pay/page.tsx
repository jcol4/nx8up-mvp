import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { calcFeeBreakdown, NX_FEE_RATE } from '@/lib/constants'
import { TIER_COOLDOWN_DAYS, TIER_LABELS } from '@/lib/reputation'
import type { ReputationTier } from '@/lib/reputation'
import SponsorHeader from '../../../_components/dashboard/SponsorHeader'
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

  // Re-use an existing open PI — but only if the amount still matches the current budget
  if (existingPiId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(existingPiId)
      const isOpen = ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)
      if (isOpen && existing.client_secret) {
        if (existing.amount !== budget * 100) {
          // Budget changed after PI was created — cancel the stale PI and fall through to create a fresh one
          await stripe.paymentIntents.cancel(existingPiId).catch(() => { })
        } else {
          // Ensure the PI has all the right payment method types (sponsor may want to switch)
          const currentTypes: string[] = (existing.payment_method_types as string[]) ?? []
          const needsUpdate = paymentMethodTypes.some(t => !currentTypes.includes(t))
          if (needsUpdate) {
            const updated = await stripe.paymentIntents.update(existingPiId, { payment_method_types: paymentMethodTypes })
            return updated.client_secret!
          }
          return existing.client_secret
        }
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
    select: { id: true, email: true, reputation_tier: true },
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
            payment_confirmed_at: new Date(),
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
          <div className="dash-panel dash-panel--nx-top p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="dash-text-muted">Creator payout pool</span>
              <span className="text-[#22c55e] font-semibold">${creatorPool.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="dash-text-muted">nx8up platform fee ({Math.round(NX_FEE_RATE * 100)}%)</span>
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

          {/* Start date cooldown notice */}
          {(() => {
            const tier = ((sponsor.reputation_tier ?? 'neutral') as ReputationTier)
            const cooldown = TIER_COOLDOWN_DAYS[tier]
            if (cooldown === null) {
              return (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 p-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs text-red-300">
                    Your account is <span className="font-semibold">Sanctioned</span>. After payment, launching this campaign will require admin approval.
                  </p>
                </div>
              )
            }
            if (cooldown > 0) {
              return (
                <div className="flex items-start gap-2.5 rounded-lg border border-[#99f7ff]/20 bg-[#99f7ff]/5 p-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#99f7ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-[#99f7ff]/80">
                    As a <span className="font-semibold text-[#99f7ff]">{TIER_LABELS[tier]}</span> sponsor, your campaign start date must be at least {cooldown} day{cooldown !== 1 ? 's' : ''} after payment confirmation.
                  </p>
                </div>
              )
            }
            return null
          })()}

          {/* Launch-is-irreversible warning */}
          <div className="flex items-start gap-2.5 rounded-lg border border-[#eab308]/25 bg-[#eab308]/8 p-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#eab308]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-[#eab308]/90">
              Once you launch your campaign, refunds are no longer available. You may request a refund any time before launching.
            </p>
          </div>

          <PaymentForm
            clientSecret={clientSecret}
            campaignTitle={campaign.title}
            budgetDisplay={`$${campaign.budget.toLocaleString()}`}
            returnUrl={returnUrl}
            largeBudget={largeBudget}
            preferredPaymentMethod={campaign.preferred_payment_method ?? null}
          />
        </div>
      </div>
    </>
  )
}
