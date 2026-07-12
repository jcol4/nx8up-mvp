/**
 * Notification event registry — the single source of truth for what each
 * domain notification *is*.
 *
 * Before this seam, every one of ~20 call sites hand-assembled a notification:
 * it picked the storage `type`, restated the `role`, wrote the title/message
 * wording (often branching on accepted/rejected), chose the `link`, and set the
 * dedupe key. That scattered the definition of "what a payout_sent notification
 * looks like" across the codebase, let the same wording drift between two call
 * sites, and — most dangerously — let a caller pass a `role` that disagreed with
 * the `type`, silently filing a notification into the wrong dashboard feed.
 *
 * Now a caller emits a typed domain event carrying only domain data
 * (`notify({ type: 'payout_sent', userId, campaignTitle, transferId })`) and
 * this module owns everything else. `renderNotification` is pure — it maps an
 * event to a `CreateNotificationInput` — so it is the test surface. `role` is
 * *derived* from the resolved storage type (see `roleForType`), so it can never
 * disagree with the type again.
 *
 * Mirrors the reputation-event seam (`ReputationEvent` + `reputationDelta` +
 * `recordReputationEvent`): a discriminated union + a pure encoder + a thin
 * persistence wrapper.
 */
import { createNotification, type CreateNotificationInput } from '@/lib/notifications'
import {
  NOTIFICATION_TYPES,
  type NotificationType,
  type NotificationRole,
  CREATOR_NOTIFICATION_TYPES,
  SPONSOR_NOTIFICATION_TYPES,
  ADMIN_NOTIFICATION_TYPES,
} from '@/lib/notification-types'

// ─── Role derivation ─────────────────────────────────────────────────────────
// Which dashboard feed a type belongs to is already encoded by the per-role
// arrays in notification-types.ts. Invert them once so `role` is a function of
// `type` rather than a value each caller has to restate (and can get wrong).
// `system` is deliberately excluded: it is the one type shared by all three
// feeds, so it has no unique role — no event below resolves to it.
const ROLE_BY_TYPE: Partial<Record<NotificationType, NotificationRole>> = {}
for (const t of CREATOR_NOTIFICATION_TYPES) if (t !== 'system') ROLE_BY_TYPE[t] = 'creator'
for (const t of SPONSOR_NOTIFICATION_TYPES) if (t !== 'system') ROLE_BY_TYPE[t] = 'sponsor'
for (const t of ADMIN_NOTIFICATION_TYPES) if (t !== 'system') ROLE_BY_TYPE[t] = 'admin'

/** The dashboard feed a notification type belongs to. Throws for role-ambiguous types. */
export function roleForType(type: NotificationType): NotificationRole {
  const role = ROLE_BY_TYPE[type]
  if (!role) {
    throw new Error(`[notification-events] no unique role for notification type "${type}"`)
  }
  return role
}

// ─── Event union ─────────────────────────────────────────────────────────────
// One variant per domain moment. Variants whose storage type splits on an
// outcome (accepted/rejected, approved/denied) carry a boolean and let
// `renderNotification` own the branch, so the two-sided wording lives once.

/** A domain moment worth notifying a user about. Carries only domain data. */
export type NotificationEvent =
  // ── Creator-facing ──
  | { type: 'payout_sent'; userId: string; campaignTitle: string; transferId: string }
  | { type: 'payout_failed'; userId: string }
  | { type: 'campaign_live'; userId: string; campaignTitle: string }
  | { type: 'direct_invite'; userId: string; campaignTitle: string }
  | { type: 'application_decided'; userId: string; campaignTitle: string; accepted: boolean }
  | { type: 'submission_reviewed'; userId: string; campaignTitle: string; approved: boolean; sponsorNotes?: string | null }
  | { type: 'admin_submission_verdict'; userId: string; campaignTitle: string; verified: boolean; notes?: string | null }
  | { type: 'campaign_cancelled'; userId: string; campaignTitle: string }
  | { type: 'opt_out_verdict'; userId: string; campaignTitle: string; approved: boolean; scoreDelta?: number }
  | { type: 'level_up'; userId: string; level: number; rankName: string }
  // ── Sponsor-facing ──
  | { type: 'payment_confirmed'; userId: string; campaignTitle: string | null; paymentIntentId: string }
  | { type: 'payment_failed'; userId: string; campaignTitle: string | null }
  | { type: 'creator_applied'; userId: string; campaignId: string; campaignTitle: string; viaInvite: boolean }
  | { type: 'launch_verdict'; userId: string; campaignTitle: string; approved: boolean; adminNotes?: string | null }
  | { type: 'refund_verdict'; userId: string; campaignTitle: string; verdict: 'valid' | 'invalid'; scoreDelta: number }
  // ── Admin-facing ──
  | {
      type: 'dispute_created'
      userId: string
      amountLabel: string
      reason: string
      dueBy: Date
      disputeId: string
      stripeDisputeId: string
    }

/** The concrete storage type + wording a domain event resolves to (role is derived). */
type RenderedNotification = Omit<CreateNotificationInput, 'role'> & { type: NotificationType }

/**
 * Pure mapping from a domain event to its stored shape (type/title/message/link/
 * dedupe). Owns every string a user sees and every accepted/rejected branch.
 */
function describe(event: NotificationEvent): RenderedNotification {
  switch (event.type) {
    case 'payout_sent':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.PAYOUT_SENT,
        title: 'Payout sent',
        message: `Your payout for "${event.campaignTitle}" has been sent to your bank account.`,
        link: '/creator/campaigns',
        dedupeKey: event.transferId,
      }
    case 'payout_failed':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.PAYOUT_FAILED,
        title: 'Payout failed',
        message: 'A payout to your bank account failed. Please check your Stripe payout settings.',
        link: '/creator/profile',
      }
    case 'campaign_live':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.CAMPAIGN_LAUNCHED,
        title: 'Campaign is live!',
        message: `"${event.campaignTitle}" has launched. Head to your deal room to get started.`,
        link: '/creator/deal-room',
      }
    case 'direct_invite':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.DIRECT_INVITE,
        title: 'You have a direct invite',
        message: `A sponsor has personally invited you to their campaign "${event.campaignTitle}". Check your campaigns to respond.`,
        link: '/creator/campaigns',
      }
    case 'application_decided':
      return {
        userId: event.userId,
        type: event.accepted
          ? NOTIFICATION_TYPES.APPLICATION_ACCEPTED
          : NOTIFICATION_TYPES.APPLICATION_REJECTED,
        title: event.accepted ? 'Application accepted!' : 'Application update',
        message: event.accepted
          ? `You've been accepted for "${event.campaignTitle}". Check your deal room.`
          : `Your application for "${event.campaignTitle}" was not selected.`,
        link: '/creator/campaigns',
      }
    case 'submission_reviewed':
      return {
        userId: event.userId,
        type: event.approved
          ? NOTIFICATION_TYPES.SUBMISSION_APPROVED
          : NOTIFICATION_TYPES.SUBMISSION_REVISION,
        title: event.approved ? 'Submission approved!' : 'Revision requested',
        message: event.approved
          ? `Your content for "${event.campaignTitle}" has been approved.`
          : `The sponsor has requested changes to your "${event.campaignTitle}" submission.${event.sponsorNotes ? ` Note: ${event.sponsorNotes}` : ''}`,
        link: '/creator/campaigns',
      }
    case 'admin_submission_verdict':
      return {
        userId: event.userId,
        type: event.verified
          ? NOTIFICATION_TYPES.ADMIN_VERIFIED
          : NOTIFICATION_TYPES.ADMIN_REJECTED,
        title: event.verified ? 'Submission verified' : 'Submission rejected',
        message: event.verified
          ? `Your content for "${event.campaignTitle}" has been verified by admin.`
          : `Your submission for "${event.campaignTitle}" was rejected by admin.${event.notes ? ` Reason: ${event.notes}` : ''}`,
        link: '/creator/campaigns',
      }
    case 'campaign_cancelled':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.CAMPAIGN_CANCELLED_CREATOR,
        title: 'Campaign cancelled',
        message: `"${event.campaignTitle}" has been cancelled by the sponsor. Your application has been closed.`,
        link: '/creator/campaigns',
      }
    case 'opt_out_verdict':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.OPT_OUT_VERDICT,
        title: event.approved ? 'Opt-Out Approved' : 'Opt-Out Rejected',
        message: event.approved
          ? `Your opt-out request for "${event.campaignTitle}" has been approved. No reputation penalty was applied.`
          : `Your opt-out request for "${event.campaignTitle}" was marked as invalid or rejected. Your reputation score has been adjusted by ${event.scoreDelta}.`,
        link: '/creator/campaigns',
      }
    case 'level_up':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.LEVEL_UP,
        title: `Level ${event.level}`,
        message: `Rank updated to ${event.rankName}.`,
        link: '/creator',
      }
    case 'payment_confirmed':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
        title: 'Payment confirmed',
        message: `Your campaign "${event.campaignTitle ?? 'campaign'}" is now live.`,
        link: '/sponsor/campaigns',
        dedupeKey: event.paymentIntentId,
      }
    case 'payment_failed':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.PAYMENT_FAILED,
        title: 'Payment failed',
        message: `Payment for "${event.campaignTitle ?? 'your campaign'}" could not be processed. Please retry.`,
        link: '/sponsor/campaigns',
      }
    case 'creator_applied':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.CREATOR_APPLIED,
        title: event.viaInvite ? 'Creator accepted your invite' : 'New creator application',
        message: event.viaInvite
          ? `A creator has accepted your direct invite to "${event.campaignTitle}".`
          : `A creator has applied to your campaign "${event.campaignTitle}".`,
        link: `/sponsor/campaigns/${event.campaignId}/applications`,
      }
    case 'launch_verdict':
      return {
        userId: event.userId,
        type: event.approved
          ? NOTIFICATION_TYPES.LAUNCH_APPROVED
          : NOTIFICATION_TYPES.LAUNCH_DENIED,
        title: event.approved ? 'Campaign launch approved' : 'Campaign launch denied',
        message: event.approved
          ? `Your campaign "${event.campaignTitle}" has been approved and is now launched.`
          : `Your launch request for "${event.campaignTitle}" was denied.${event.adminNotes ? ` Reason: ${event.adminNotes}` : ''}`,
        link: '/sponsor/campaigns',
      }
    case 'refund_verdict': {
      const verdictLabel = event.verdict === 'valid' ? 'accepted as valid' : 'marked as invalid'
      const scoreMsg =
        event.scoreDelta < 0 ? ` Your reputation score has been adjusted by ${event.scoreDelta}.` : ''
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.REFUND_VERDICT,
        title: 'Refund request reviewed',
        message: `Your refund request for "${event.campaignTitle}" has been ${verdictLabel}.${scoreMsg}`,
        link: '/sponsor/campaigns',
      }
    }
    case 'dispute_created':
      return {
        userId: event.userId,
        type: NOTIFICATION_TYPES.DISPUTE_CREATED,
        title: 'New dispute received',
        message: `A ${event.amountLabel} dispute (${event.reason.replace(/_/g, ' ')}) needs your review. Evidence due ${event.dueBy.toLocaleDateString()}.`,
        link: `/admin/disputes/${event.disputeId}`,
        dedupeKey: event.stripeDisputeId,
      }
    default: {
      // Exhaustiveness guard: a new event variant without a case fails to compile.
      const _exhaustive: never = event
      throw new Error(`[notification-events] unhandled event: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

/**
 * Pure: the full `CreateNotificationInput` for a domain event, with `role`
 * derived from the resolved type so it can never disagree. This is the seam's
 * test surface — assert wording/link/dedupe/role here, not at the call sites.
 */
export function renderNotification(event: NotificationEvent): CreateNotificationInput {
  const rendered = describe(event)
  return { ...rendered, role: roleForType(rendered.type) }
}

/**
 * Emit a domain notification: render it, then persist via `createNotification`
 * (which owns dedupe, optional email, and silent error-swallowing). Returns the
 * created record, or null if deduplicated / on error.
 */
export function notify(event: NotificationEvent) {
  return createNotification(renderNotification(event))
}
