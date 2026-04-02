'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

async function assertAdmin() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') throw new Error('Unauthorized')
}

export async function getAdminDealRoomQueue() {
  await assertAdmin()

  return prisma.deal_submissions.findMany({
    where: { status: 'submitted' },
    orderBy: { submitted_at: 'asc' },
    include: {
      application: {
        include: {
          campaign: {
            select: { id: true, title: true, brand_name: true, end_date: true },
          },
          creator: {
            select: {
              twitch_username: true,
              youtube_channel_name: true,
              platform: true,
            },
          },
        },
      },
    },
  })
}

export async function getAdminDealRoomSubmission(applicationId: string) {
  await assertAdmin()

  return prisma.deal_submissions.findUnique({
    where: { application_id: applicationId },
    include: {
      application: {
        include: {
          campaign: {
            include: { sponsor: { select: { company_name: true } } },
          },
          creator: {
            select: {
              twitch_username: true,
              youtube_channel_name: true,
              platform: true,
              subs_followers: true,
              youtube_subscribers: true,
            },
          },
        },
      },
    },
  })
}

export async function adminReviewSubmission(
  applicationId: string,
  decision: 'admin_verified' | 'admin_rejected',
  notes?: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const submission = await prisma.deal_submissions.findUnique({
    where: { application_id: applicationId },
  })
  if (!submission) return { error: 'Submission not found.' }
  if (submission.status !== 'submitted') return { error: 'Submission is not pending admin review.' }

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { status: decision, admin_notes: notes ?? null },
  })

  revalidatePath('/admin/verification-queue')
  revalidatePath(`/admin/verification-queue/${applicationId}`)
  revalidatePath(`/sponsor/verification-queue/${applicationId}`)
  revalidatePath('/sponsor/verification-queue')
  revalidatePath(`/creator/verification-queue/${applicationId}`)

  return { success: true }
}
