'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notification-events'
import { initiateCreatorPayout, payoutIneligibleMessage } from '@/lib/payouts'

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
      campaign: { select: { sponsor_id: true, title: true } },
      creator: { select: { clerk_user_id: true } },
    },
  })
  if (!app || app.campaign.sponsor_id !== sponsor.id) {
    return { error: 'Not authorized.' }
  }

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { status, sponsor_notes: sponsorNotes ?? null },
  })

  await notify({
    type: 'submission_reviewed',
    userId: app.creator.clerk_user_id,
    campaignTitle: app.campaign.title,
    approved: status === 'approved',
    sponsorNotes,
  })

  // Trigger payout when the sponsor approves. Best-effort: the approval still succeeds
  // even if the payout can't go through yet (surfaced as payoutError for a later retry).
  let payoutError: string | undefined

  if (status === 'approved') {
    const outcome = await initiateCreatorPayout(applicationId)
    if (outcome.kind === 'transfer_failed') {
      payoutError = outcome.message
    } else if (outcome.kind === 'ineligible' && outcome.reason === 'charge_unresolved') {
      payoutError = 'Could not locate a completed payment for this campaign — payout skipped. Use Retry Payout once payment settles.'
    } else if (outcome.kind === 'ineligible') {
      console.warn(`[payout] skipped for application ${applicationId} — ${outcome.reason}`)
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
    select: { campaign: { select: { sponsor_id: true } } },
  })
  if (!app || app.campaign.sponsor_id !== sponsor.id) return { error: 'Not authorized.' }

  const outcome = await initiateCreatorPayout(applicationId)
  switch (outcome.kind) {
    case 'paid':
      revalidatePath(`/sponsor/deal-room/${applicationId}`)
      return { success: true }
    case 'already_paid':
      return { error: 'Already paid.' }
    case 'in_progress':
      return { error: 'A payout is already in progress for this submission. Check the Stripe dashboard.' }
    case 'transfer_failed':
      return { error: outcome.message }
    case 'ineligible':
      return { error: payoutIneligibleMessage(outcome.reason) }
  }
}
