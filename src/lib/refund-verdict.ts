/**
 * Refund-verdict resolution — the shared body behind the admin refund decision.
 *
 * An admin can rule on a refund request from two transports: the admin dashboard server
 * action and the `POST /api/admin/refund-requests/[id]/verdict` route. Both used to carry a
 * byte-for-byte copy of this logic — the status write, the (verdict × hadAccepted)
 * reputation dock, and the sponsor notification — so a change to one could silently drift
 * from the other on a money-adjacent, reputation-docking path.
 *
 * That logic now lives here once. `resolveRefundVerdict` is transport-agnostic and does NOT
 * authorize — each transport authorizes first (see admin-auth) and then maps the returned
 * outcome to its own response shape, mirroring the payout seam's "auth lives in adapters".
 */
import { prisma } from '@/lib/prisma'
import { recordReputationEvent } from '@/lib/reputation'
import { notify } from '@/lib/notification-events'

/** The result of attempting to resolve a refund verdict — each transport maps this to its own response. */
export type RefundVerdictOutcome =
  | { kind: 'not_found' }
  | { kind: 'already_recorded' }
  | { kind: 'resolved' }

/**
 * Records an admin's verdict on a refund request: writes the verdict, docks the sponsor's
 * reputation per the refund rules, and notifies them. Idempotent on the `pending` guard —
 * a request already ruled on returns `already_recorded` without re-docking reputation.
 *
 * Assumes the caller has already authorized the admin.
 */
export async function resolveRefundVerdict(
  requestId: string,
  verdict: 'valid' | 'invalid',
  adminNotes?: string,
): Promise<RefundVerdictOutcome> {
  const req = await prisma.refund_requests.findUnique({
    where: { id: requestId },
    include: {
      sponsor: { select: { id: true, clerk_user_id: true } },
      campaign: { select: { title: true } },
    },
  })
  if (!req) return { kind: 'not_found' }
  if (req.verdict !== 'pending') return { kind: 'already_recorded' }

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

  await notify({
    type: 'refund_verdict',
    userId: req.sponsor.clerk_user_id,
    campaignTitle: req.campaign.title,
    verdict,
    scoreDelta: delta,
  })

  return { kind: 'resolved' }
}
