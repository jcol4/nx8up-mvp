'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveRefundVerdict } from '@/lib/refund-verdict'

export async function getRefundRequests() {
  await requireAdmin()
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
    await requireAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const outcome = await resolveRefundVerdict(requestId, verdict, adminNotes)
  switch (outcome.kind) {
    case 'not_found':
      return { error: 'Refund request not found.' }
    case 'already_recorded':
      return { error: 'Verdict already recorded.' }
    case 'resolved':
      revalidatePath('/admin/refund-requests')
      return { success: true }
  }
}
