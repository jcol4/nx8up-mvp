'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { recordReputationEvent } from '@/lib/reputation'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

async function assertAdmin() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') throw new Error('Unauthorized')
}

export async function getRefundRequests() {
  await assertAdmin()
  return prisma.refund_requests.findMany({
    orderBy: { created_at: 'asc' },
    include: {
      campaign: { select: { title: true, budget: true } },
      sponsor: { select: { company_name: true, email: true, reputation_tier: true, reputation_score: true } },
    },
  })
}

export async function submitRefundVerdict(
  requestId: string,
  verdict: 'valid' | 'invalid',
  adminNotes?: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const req = await prisma.refund_requests.findUnique({
    where: { id: requestId },
    include: {
      sponsor: { select: { id: true, clerk_user_id: true } },
      campaign: { select: { title: true } },
    },
  })
  if (!req) return { error: 'Refund request not found.' }
  if (req.verdict !== 'pending') return { error: 'Verdict already recorded.' }

  await prisma.refund_requests.update({
    where: { id: requestId },
    data: { verdict, admin_notes: adminNotes ?? null },
  })

  const change = await recordReputationEvent({
    type: 'refund_ruled',
    sponsorId: req.sponsor.id,
    verdict,
    hadAcceptedApplications: req.had_accepted_applications,
  })
  const delta = change?.delta ?? 0

  const verdictLabel = verdict === 'valid' ? 'accepted as valid' : 'marked as invalid'
  const scoreMsg = delta < 0 ? ` Your reputation score has been adjusted by ${delta}.` : ''

  await createNotification({
    userId: req.sponsor.clerk_user_id,
    role: 'sponsor',
    type: NOTIFICATION_TYPES.REFUND_VERDICT,
    title: 'Refund request reviewed',
    message: `Your refund request for "${req.campaign.title}" has been ${verdictLabel}.${scoreMsg}`,
    link: '/sponsor/campaigns',
  })

  revalidatePath('/admin/refund-requests')
  return { success: true }
}
