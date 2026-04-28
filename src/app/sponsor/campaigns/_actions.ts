'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { sponsorDashboardCacheTag } from '@/lib/sponsor-dashboard-cache'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
    .slice(0, 8)
}

export async function publishCampaign(id: string): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return { error: 'Sponsor account not found.' }

  const campaign = await prisma.campaigns.findUnique({ where: { id } })
  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    return { error: 'You are not allowed to publish this campaign.' }
  }

  await prisma.campaigns.update({ where: { id }, data: { status: 'pending_payment' } })

  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  revalidateTag(sponsorDashboardCacheTag(sponsor.id))

  return { success: true }
}

export async function launchCampaign(id: string): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return { error: 'Sponsor account not found.' }

  const campaign = await prisma.campaigns.findUnique({
    where: { id },
    include: {
      applications: {
        where: { status: 'accepted' },
        select: { id: true, creator: { select: { clerk_user_id: true } } },
      },
    },
  })
  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    return { error: 'You are not allowed to launch this campaign.' }
  }
  if (campaign.status === 'pending_payment') {
    return { error: 'Payment is required before launching. Please complete your payment first.' }
  }
  if (campaign.status !== 'live') {
    return { error: 'Only funded campaigns can be launched.' }
  }
  if (!campaign.stripe_charge_id) {
    return { error: 'Payment has not been confirmed yet. Please wait for your payment to settle.' }
  }
  if (campaign.applications.length === 0) {
    return { error: 'You must accept at least one creator before launching.' }
  }

  await prisma.campaigns.update({ where: { id }, data: { status: 'launched' } })

  await Promise.all(
    campaign.applications.map((app) =>
      createNotification({
        userId: app.creator.clerk_user_id,
        role: 'creator',
        type: NOTIFICATION_TYPES.CAMPAIGN_LAUNCHED,
        title: 'Campaign is live!',
        message: `"${campaign.title}" has launched. Head to your deal room to get started.`,
        link: '/creator/deal-room',
      })
    )
  )

  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  revalidateTag(sponsorDashboardCacheTag(sponsor.id))

  return { success: true }
}

export async function deleteCampaign(id: string): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return { error: 'Sponsor account not found.' }

  const campaign = await prisma.campaigns.findUnique({ where: { id } })
  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    return { error: 'You are not allowed to delete this campaign.' }
  }

  await prisma.campaigns.delete({ where: { id } })

  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  revalidateTag(sponsorDashboardCacheTag(sponsor.id))

  return { success: true }
}

export async function setApplicationStatus(
  applicationId: string,
  campaignId: string,
  status: 'accepted' | 'rejected',
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return { error: 'Sponsor account not found.' }

  const application = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: true,
      creator: { select: { clerk_user_id: true } },
    },
  })

  if (!application || application.campaign_id !== campaignId || application.campaign.sponsor_id !== sponsor.id) {
    return { error: 'You are not allowed to update this application.' }
  }

  // Generate a unique tracking short code when accepting a creator for a campaign with a link
  let tracking_short_code = application.tracking_short_code
  if (status === 'accepted' && !tracking_short_code && application.campaign.landing_page_url) {
    let code = generateShortCode()
    while (await prisma.campaign_applications.findUnique({ where: { tracking_short_code: code } })) {
      code = generateShortCode()
    }
    tracking_short_code = code
  }

  await prisma.campaign_applications.update({
    where: { id: applicationId },
    data: { status, ...(tracking_short_code ? { tracking_short_code } : {}) },
  })

  await createNotification({
    userId: application.creator.clerk_user_id,
    role: 'creator',
    type: status === 'accepted' ? NOTIFICATION_TYPES.APPLICATION_ACCEPTED : NOTIFICATION_TYPES.APPLICATION_REJECTED,
    title: status === 'accepted' ? 'Application accepted!' : 'Application update',
    message: status === 'accepted'
      ? `You've been accepted for "${application.campaign.title}". Check your deal room.`
      : `Your application for "${application.campaign.title}" was not selected.`,
    link: '/creator/campaigns',
  })

  revalidatePath(`/sponsor/campaigns/${campaignId}/applications`)
  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  revalidateTag(sponsorDashboardCacheTag(sponsor.id))

  return { success: true }
}
