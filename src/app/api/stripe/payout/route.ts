/**
 * POST /api/stripe/payout
 * Body: { applicationId: string }
 *
 * Sponsor-triggered creator payout. Authorizes that the caller's sponsor owns the
 * application, then delegates the money movement to `initiateCreatorPayout`
 * (see src/lib/payouts.ts), mapping the domain outcome to HTTP status codes.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { initiateCreatorPayout, payoutIneligibleMessage } from '@/lib/payouts'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicationId } = await request.json()
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })

  const application = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    select: { campaign: { select: { sponsor_id: true } } },
  })
  if (!application || application.campaign.sponsor_id !== sponsor.id) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const outcome = await initiateCreatorPayout(applicationId)
  switch (outcome.kind) {
    case 'paid':
      return NextResponse.json({ success: true, transferId: outcome.transferId })
    case 'already_paid':
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    case 'in_progress':
      return NextResponse.json({ error: 'Payout already in progress' }, { status: 409 })
    case 'transfer_failed':
      return NextResponse.json({ error: outcome.message }, { status: 500 })
    case 'ineligible':
      return NextResponse.json({ error: payoutIneligibleMessage(outcome.reason) }, { status: 400 })
  }
}
