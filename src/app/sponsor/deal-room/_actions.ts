'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { calcFeeBreakdown } from '@/lib/constants'

async function getSponsor(userId: string) {
  return prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
}

export async function getSponsorDealRooms() {
  const { userId } = await auth()
  if (!userId) return []

  const sponsor = await getSponsor(userId)
  if (!sponsor) return []

  return prisma.campaign_applications.findMany({
    where: {
      status: 'accepted',
      campaign: { sponsor_id: sponsor.id, status: 'launched' },
    },
    orderBy: { submitted_at: 'desc' },
    include: {
      campaign: {
        select: { id: true, title: true, brand_name: true, status: true, end_date: true },
      },
      creator: {
        select: {
          id: true,
          twitch_username: true,
          youtube_channel_name: true,
          platform: true,
        },
      },
      deal_submission: {
        select: { status: true, submitted_at: true },
      },
      _count: { select: { link_clicks: true } },
    },
  })
}

export async function getDealRoomForSponsor(applicationId: string) {
  const { userId } = await auth()
  if (!userId) return null

  const sponsor = await getSponsor(userId)
  if (!sponsor) return null

  return prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: {
        include: { sponsor: { select: { company_name: true, id: true } } },
      },
      creator: {
        select: {
          id: true,
          twitch_username: true,
          youtube_channel_name: true,
          platform: true,
          subs_followers: true,
          youtube_subscribers: true,
        },
      },
      deal_submission: true,
      _count: { select: { link_clicks: true } },
    },
  }).then((app) => {
    if (!app || app.campaign.sponsor.id !== sponsor.id) return null
    if (app.campaign.status !== 'launched') return null
    return app
  })
}

export async function updateSubmissionStatus(
  applicationId: string,
  status: 'approved' | 'revision_requested',
  sponsorNotes?: string,
): Promise<{ error?: string; success?: boolean; payoutError?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await getSponsor(userId)
  if (!sponsor) return { error: 'Sponsor account not found.' }

  const app = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: {
        select: {
          sponsor_id: true,
          budget: true,
          creator_count: true,
          stripe_charge_id: true,
          title: true,
        },
      },
      creator: {
        select: { stripe_connect_id: true, stripe_onboarding_complete: true },
      },
      deal_submission: {
        select: { payout_status: true },
      },
    },
  })
  if (!app || app.campaign.sponsor_id !== sponsor.id) {
    return { error: 'Not authorized.' }
  }

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { status, sponsor_notes: sponsorNotes ?? null },
  })

  // Trigger payout when sponsor approves
  let payoutError: string | undefined

  if (status === 'approved') {
    const { campaign, creator, deal_submission: sub } = app

    if (sub?.payout_status === 'paid' || sub?.payout_status === 'processing') {
      // Already paid or another request is mid-flight — skip
    } else if (!creator.stripe_connect_id || !creator.stripe_onboarding_complete) {
      console.warn(`[payout] skipped for application ${applicationId} — creator has not completed Stripe Connect onboarding`)
    } else if (!campaign.stripe_charge_id) {
      console.warn(`[payout] skipped for application ${applicationId} — campaign stripe_charge_id is null (payment may still be settling)`)
    } else if (!campaign.budget) {
      console.warn(`[payout] skipped for application ${applicationId} — campaign has no budget`)
    } else {
      const { perCreator } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
      if (!perCreator || perCreator <= 0) {
        console.warn(`[payout] skipped for application ${applicationId} — perCreator calculated as ${perCreator}`)
      } else {
        // Atomic race guard: claim the payout slot; a concurrent caller will see count=0 and skip.
        const claimed = await prisma.deal_submissions.updateMany({
          where: { application_id: applicationId, payout_status: null },
          data: { payout_status: 'processing' },
        })
        if (claimed.count > 0) {
          try {
            const transfer = await stripe.transfers.create(
              {
                amount: perCreator * 100,
                currency: 'usd',
                destination: creator.stripe_connect_id,
                source_transaction: campaign.stripe_charge_id,
                metadata: { applicationId, campaignId: app.campaign_id },
                description: `Payout for campaign: ${campaign.title}`,
              },
              { idempotencyKey: `transfer-${applicationId}` },
            )
            await prisma.deal_submissions.update({
              where: { application_id: applicationId },
              data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
            })
            console.log(`[payout] transfer ${transfer.id} sent for application ${applicationId}`)
          } catch (err) {
            payoutError = err instanceof Error ? err.message : 'Stripe transfer failed'
            console.error('[payout] transfer failed for application', applicationId, err)
            // Reset guard so retryPayout can attempt again
            await prisma.deal_submissions.update({
              where: { application_id: applicationId },
              data: { payout_status: null },
            }).catch(() => {})
          }
        }
      }
    }
  }

  revalidatePath(`/sponsor/deal-room/${applicationId}`)
  revalidatePath('/sponsor/deal-room')

  return payoutError ? { success: true, payoutError } : { success: true }
}

export async function retryPayout(
  applicationId: string,
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await getSponsor(userId)
  if (!sponsor) return { error: 'Sponsor account not found.' }

  const app = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: {
        select: {
          id: true,
          sponsor_id: true,
          budget: true,
          creator_count: true,
          stripe_charge_id: true,
          title: true,
        },
      },
      creator: {
        select: { stripe_connect_id: true, stripe_onboarding_complete: true },
      },
      deal_submission: {
        select: { status: true, payout_status: true, stripe_transfer_id: true },
      },
    },
  })

  if (!app || app.campaign.sponsor_id !== sponsor.id) return { error: 'Not authorized.' }

  const { campaign, creator, deal_submission: sub } = app

  if (!sub) return { error: 'No submission found.' }
  if (sub.status !== 'approved') return { error: 'Submission is not approved.' }
  if (sub.payout_status === 'paid') return { error: 'Already paid.' }
  if (sub.stripe_transfer_id) return { error: 'Transfer already exists — payout may be pending. Check the Stripe dashboard.' }

  if (!creator.stripe_connect_id || !creator.stripe_onboarding_complete) {
    return { error: 'Creator has not completed Stripe payout setup.' }
  }
  if (!campaign.budget) return { error: 'Campaign has no budget.' }

  // Resolve charge ID — DB first, then Stripe lookup as fallback
  let chargeId = campaign.stripe_charge_id
  if (!chargeId) {
    // Try the stored PI first
    const { stripe_payment_intent_id } = await prisma.campaigns.findUniqueOrThrow({
      where: { id: campaign.id },
      select: { stripe_payment_intent_id: true },
    })

    let resolvedPiId: string | null = null

    if (stripe_payment_intent_id) {
      const pi = await stripe.paymentIntents.retrieve(stripe_payment_intent_id)
      if (pi.status === 'succeeded') {
        resolvedPiId = pi.id
        const latestCharge = typeof pi.latest_charge === 'string'
          ? pi.latest_charge
          : (pi.latest_charge as { id: string } | null)?.id ?? null
        if (latestCharge) chargeId = latestCharge
      }
    }

    // If stored PI wasn't the succeeded one, search Stripe by campaign metadata
    if (!chargeId) {
      const results = await stripe.paymentIntents.search({
        query: `metadata['campaignId']:'${campaign.id}' AND status:'succeeded'`,
        limit: 5,
      })
      const succeededPi = results.data[0] ?? null
      if (succeededPi) {
        resolvedPiId = succeededPi.id
        const latestCharge = typeof succeededPi.latest_charge === 'string'
          ? succeededPi.latest_charge
          : (succeededPi.latest_charge as { id: string } | null)?.id ?? null
        if (latestCharge) chargeId = latestCharge
      }
    }

    if (!chargeId) {
      return { error: 'Could not locate a completed payment for this campaign. Check the Stripe dashboard.' }
    }

    // Persist so future calls don't need to re-fetch
    await prisma.campaigns.update({
      where: { id: campaign.id },
      data: {
        stripe_charge_id: chargeId,
        ...(resolvedPiId ? { stripe_payment_intent_id: resolvedPiId } : {}),
      },
    })
  }

  const { perCreator } = calcFeeBreakdown(campaign.budget, app.campaign.creator_count ?? null)
  if (!perCreator || perCreator <= 0) return { error: 'Could not calculate payout amount.' }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: perCreator * 100,
        currency: 'usd',
        destination: creator.stripe_connect_id,
        source_transaction: chargeId,
        metadata: { applicationId, campaignId: campaign.id },
        description: `Payout for campaign: ${campaign.title}`,
      },
      { idempotencyKey: `transfer-${applicationId}` },
    )
    await prisma.deal_submissions.update({
      where: { application_id: applicationId },
      data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Stripe transfer failed'
    console.error('Retry payout failed:', err)
    return { error: msg }
  }

  revalidatePath(`/sponsor/deal-room/${applicationId}`)
  return { success: true }
}
