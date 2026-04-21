/**
 * Server actions for sponsor campaign management (/sponsor/campaigns).
 *
 * Exports:
 * - `publishCampaign`       — advances a draft campaign to `pending_payment`
 *                             status so the sponsor is directed to pay.
 * - `launchCampaign`        — advances a `live` (funded) campaign to `launched`,
 *                             notifying all accepted creators via the notification
 *                             system. Requires at least one accepted creator and
 *                             a confirmed Stripe charge ID on the campaign.
 * - `deleteCampaign`        — hard-deletes a campaign record. No status restriction
 *                             is enforced here — any campaign owned by the sponsor
 *                             can be deleted, including live ones.
 * - `setApplicationStatus`  — accepts or rejects a creator application. On accept,
 *                             generates a unique 8-char tracking short code (if the
 *                             campaign has a landing page URL) and notifies the creator.
 *
 * All actions verify that the calling user owns the campaign/application before
 * mutating data.
 *
 * External services: Clerk (auth), Prisma, @/lib/notifications (in-app notifications).
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

/**
 * Generates a cryptographically random 8-character lowercase alphanumeric code
 * used as a per-creator tracking URL short code. Uses `randomBytes` (not
 * Math.random) to avoid predictable codes.
 */
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
    .slice(0, 8)
}

/**
 * Advances a draft campaign to `pending_payment` status, prompting the sponsor
 * to complete payment. Verifies ownership before updating.
 */
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

  return { success: true }
}

/**
 * Advances a funded (`live`) campaign to `launched` status and sends a
 * CAMPAIGN_LAUNCHED notification to all accepted creators.
 *
 * Guards:
 * - Campaign must be `live` (not pending payment or already launched).
 * - `stripe_charge_id` must be set (payment has settled).
 * - At least one accepted creator application must exist.
 */
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

  return { success: true }
}

/**
 * Hard-deletes a campaign. No guard on status — any campaign owned by the
 * authenticated sponsor can be deleted. Cascading deletes on applications /
 * submissions are handled at the database level.
 */
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

  return { success: true }
}

/**
 * Sets an application's status to `accepted` or `rejected` and notifies the
 * creator. On accept, generates a unique tracking short code (if the campaign
 * has a landing page URL) using a collision-safe loop.
 *
 * @param applicationId - The campaign application record to update.
 * @param campaignId    - Used to verify the application belongs to the right campaign.
 * @param status        - 'accepted' or 'rejected'.
 */
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

  return { success: true }
}
