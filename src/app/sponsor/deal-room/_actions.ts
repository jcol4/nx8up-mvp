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
          engagement_rate: true,
          average_vod_views: true,
          youtube_avg_views: true,
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
  if (status === 'approved') {
    const { campaign, creator, deal_submission: sub } = app

    if (sub?.payout_status !== 'paid' && creator.stripe_connect_id && creator.stripe_onboarding_complete && campaign.stripe_charge_id && campaign.budget) {
      const { perCreator } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
      if (perCreator && perCreator > 0) {
        try {
          const transfer = await stripe.transfers.create({
            amount: perCreator * 100,
            currency: 'usd',
            destination: creator.stripe_connect_id,
            source_transaction: campaign.stripe_charge_id,
            metadata: { applicationId, campaignId: app.campaign_id },
            description: `Payout for campaign: ${campaign.title}`,
          })
          await prisma.deal_submissions.update({
            where: { application_id: applicationId },
            data: { stripe_transfer_id: transfer.id, payout_status: 'paid' },
          })
        } catch (err) {
          // Payout failed — submission still approved, sponsor can retry via admin
          console.error('Payout transfer failed:', err)
        }
      }
    }
  }

  revalidatePath(`/sponsor/deal-room/${applicationId}`)
  revalidatePath('/sponsor/deal-room')

  return { success: true }
}
