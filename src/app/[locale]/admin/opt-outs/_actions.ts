'use server'

import { getSessionRole } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { recordReputationEvent } from '@/lib/reputation'
import { notify } from '@/lib/notification-events'

export async function getOptOutQueue() {
  return prisma.creator_opt_outs.findMany({
    where: { verdict: 'pending' },
    orderBy: { created_at: 'asc' },
    include: {
      creator: { select: { id: true, clerk_user_id: true, twitch_username: true, youtube_channel_name: true, reputation_score: true, reputation_tier: true } },
      application: { select: { campaign: { select: { id: true, title: true } } } },
    },
  })
}

export async function submitOptOutVerdict(
  optOutId: string,
  verdict: 'valid' | 'invalid',
  adminNotes?: string,
) {
  if ((await getSessionRole()) !== 'admin') return { error: 'Unauthorized' }

  const optOut = await prisma.creator_opt_outs.findUnique({
    where: { id: optOutId },
    include: {
      creator: { select: { id: true, clerk_user_id: true } },
      application: { select: { campaign: { select: { title: true } } } },
    },
  })

  if (!optOut) return { error: 'Opt-out request not found.' }
  if (optOut.verdict !== 'pending') return { error: 'Verdict already recorded.' }

  await prisma.creator_opt_outs.update({
    where: { id: optOutId },
    data: { verdict, admin_notes: adminNotes ?? null },
  })

  const change = await recordReputationEvent({ type: 'opt_out_ruled', creatorId: optOut.creator_id, verdict })
  const delta = change?.delta ?? 0

  const campaignTitle = optOut.application.campaign.title

  if (verdict === 'valid') {
    await notify({
      type: 'opt_out_verdict',
      userId: optOut.creator.clerk_user_id,
      campaignTitle,
      approved: true,
    })
  } else {
    await notify({
      type: 'opt_out_verdict',
      userId: optOut.creator.clerk_user_id,
      campaignTitle,
      approved: false,
      scoreDelta: delta,
    })
  }

  revalidatePath('/admin/verification-queue')
  return { success: true }
}
