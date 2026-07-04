/**
 * POST /api/admin/refund-requests/[id]/verdict
 * Body: { verdict: 'valid' | 'invalid', adminNotes? }
 *
 * Admin gives their verdict on a refund request. The verdict determines the
 * reputation score delta applied to the sponsor — the Stripe refund has
 * already been issued at request time.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { recordReputationEvent } from '@/lib/reputation'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { verdict, adminNotes } = await request.json()
  if (verdict !== 'valid' && verdict !== 'invalid') {
    return NextResponse.json({ error: 'verdict must be "valid" or "invalid"' }, { status: 400 })
  }

  const req = await prisma.refund_requests.findUnique({
    where: { id },
    include: {
      sponsor: { select: { id: true, clerk_user_id: true } },
      campaign: { select: { title: true } },
    },
  })
  if (!req) return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
  if (req.verdict !== 'pending') {
    return NextResponse.json({ error: 'Verdict already recorded' }, { status: 400 })
  }

  await prisma.refund_requests.update({
    where: { id },
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

  return NextResponse.json({ success: true })
}
