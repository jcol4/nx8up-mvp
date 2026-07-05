/**
 * POST /api/admin/refund-requests/[id]/verdict
 * Body: { verdict: 'valid' | 'invalid', adminNotes? }
 *
 * Admin gives their verdict on a refund request. The verdict determines the
 * reputation score delta applied to the sponsor — the Stripe refund has
 * already been issued at request time.
 *
 * Thin transport over `resolveRefundVerdict` — the same core the admin-dashboard
 * server action uses, so the two can't drift.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/admin-auth'
import { resolveRefundVerdict } from '@/lib/refund-verdict'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessionClaims } = await auth()
  if (!isAdmin(sessionClaims)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { verdict, adminNotes } = await request.json()
  if (verdict !== 'valid' && verdict !== 'invalid') {
    return NextResponse.json({ error: 'verdict must be "valid" or "invalid"' }, { status: 400 })
  }

  const outcome = await resolveRefundVerdict(id, verdict, adminNotes)
  switch (outcome.kind) {
    case 'not_found':
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
    case 'already_recorded':
      return NextResponse.json({ error: 'Verdict already recorded' }, { status: 400 })
    case 'resolved':
      return NextResponse.json({ success: true })
  }
}
