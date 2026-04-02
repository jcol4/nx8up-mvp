'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

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
        },
      },
      deal_submission: true,
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
    include: { campaign: { select: { sponsor_id: true } } },
  })
  if (!app || app.campaign.sponsor_id !== sponsor.id) {
    return { error: 'Not authorized.' }
  }

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { status, sponsor_notes: sponsorNotes ?? null },
  })

  revalidatePath(`/sponsor/deal-room/${applicationId}`)
  revalidatePath('/sponsor/deal-room')

  return { success: true }
}
