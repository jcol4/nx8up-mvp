/**
 * POST /api/admin/sanctioned-launches/[id]/verdict
 * Body: { verdict: 'approved' | 'denied', adminNotes? }
 *
 * Admin approves or denies a sanctioned sponsor's launch request.
 * Approval immediately launches the campaign.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin-auth'
import { notify } from '@/lib/notification-events'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { verdict, adminNotes } = await request.json()
  if (verdict !== 'approved' && verdict !== 'denied') {
    return NextResponse.json({ error: 'verdict must be "approved" or "denied"' }, { status: 400 })
  }

  const req = await prisma.sanctioned_launch_requests.findUnique({
    where: { id },
    include: {
      sponsor: { select: { id: true, clerk_user_id: true } },
      campaign: { select: { id: true, title: true, status: true } },
    },
  })
  if (!req) return NextResponse.json({ error: 'Launch request not found' }, { status: 404 })
  if (req.verdict !== 'pending') {
    return NextResponse.json({ error: 'Verdict already recorded' }, { status: 400 })
  }

  await prisma.sanctioned_launch_requests.update({
    where: { id },
    data: { verdict, admin_notes: adminNotes ?? null },
  })

  if (verdict === 'approved' && req.campaign.status === 'live') {
    await prisma.campaigns.update({
      where: { id: req.campaign.id },
      data: { status: 'launched' },
    })

    const acceptedApps = await prisma.campaign_applications.findMany({
      where: { campaign_id: req.campaign.id, status: 'accepted' },
      select: { creator: { select: { clerk_user_id: true } } },
    })
    await Promise.all(
      acceptedApps.map((app) =>
        notify({
          type: 'campaign_live',
          userId: app.creator.clerk_user_id,
          campaignTitle: req.campaign.title,
        }),
      ),
    )
  }

  await notify({
    type: 'launch_verdict',
    userId: req.sponsor.clerk_user_id,
    campaignTitle: req.campaign.title,
    approved: verdict === 'approved',
    adminNotes,
  })

  revalidatePath('/admin/verification-queue')

  return NextResponse.json({ success: true })
}
