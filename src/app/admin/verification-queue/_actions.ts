/**
 * Server actions for the admin Verification Queue (deal submissions).
 *
 * All exported functions authenticate the caller as an admin before executing.
 * The `assertAdmin` helper throws on failure, letting callers choose to catch
 * (for returning a user-facing error) or let it propagate.
 *
 * Exports:
 *  - `getAdminDealRoomQueue`      – fetches all pending (`"submitted"`)
 *    deal submissions for the queue list view.
 *  - `getAdminDealRoomSubmission` – fetches a single submission by
 *    `applicationId` for the detail review page.
 *  - `adminReviewSubmission`      – approves (`"admin_verified"`) or rejects
 *    (`"admin_rejected"`) a submission, notifies the creator, and revalidates
 *    relevant cache paths.
 *
 * External services: Clerk (auth), Prisma (deal_submissions,
 * campaign_applications, campaigns, content_creators, sponsors),
 * `@/lib/notifications` (createNotification).
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

/**
 * Throws an `Error("Unauthorized")` if the current session does not belong to
 * an admin. Intended to be called at the top of every server action in this
 * file.
 */
async function assertAdmin() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') throw new Error('Unauthorized')
}

/**
 * Returns all `deal_submissions` with status `"submitted"`, ordered
 * oldest-first (FIFO review order), including nested campaign and creator
 * details needed to render the queue list.
 */
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

/**
 * Fetches a single `deal_submissions` record by `applicationId` with all
 * related data needed to render the detail review page (proof URLs, screenshot,
 * campaign deliverables, sponsor, creator handle).
 *
 * Returns `null` if no matching submission exists.
 */
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

/**
 * Records an admin approve/reject decision on a deal submission.
 *
 * @param applicationId - The `application_id` FK on `deal_submissions`.
 * @param decision - `"admin_verified"` to approve (forwarded to sponsor) or
 *   `"admin_rejected"` to reject and notify the creator.
 * @param notes - Optional review notes included in the creator notification
 *   message and stored on the submission record.
 *
 * Guards:
 *  - Returns `{ error: 'Unauthorized' }` for non-admins.
 *  - Returns `{ error }` if the submission is not found or is not in
 *    `"submitted"` state (preventing double-review).
 *
 * Side effects on success:
 *  - Updates `deal_submissions.status` and `admin_notes`.
 *  - Sends a creator notification (`ADMIN_VERIFIED` or `ADMIN_REJECTED`).
 *  - Revalidates `/admin/verification-queue`, the specific submission page,
 *    and the corresponding sponsor + creator pages.
 */
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
    include: {
      application: {
        select: {
          campaign: { select: { title: true } },
          creator: { select: { clerk_user_id: true } },
        },
      },
    },
  })
  if (!submission) return { error: 'Submission not found.' }
  if (submission.status !== 'submitted') return { error: 'Submission is not pending admin review.' }

  await prisma.deal_submissions.update({
    where: { application_id: applicationId },
    data: { status: decision, admin_notes: notes ?? null },
  })

  await createNotification({
    userId: submission.application.creator.clerk_user_id,
    role: 'creator',
    type: decision === 'admin_verified' ? NOTIFICATION_TYPES.ADMIN_VERIFIED : NOTIFICATION_TYPES.ADMIN_REJECTED,
    title: decision === 'admin_verified' ? 'Submission verified' : 'Submission rejected',
    message: decision === 'admin_verified'
      ? `Your content for "${submission.application.campaign.title}" has been verified by admin.`
      : `Your submission for "${submission.application.campaign.title}" was rejected by admin.${notes ? ` Reason: ${notes}` : ''}`,
    link: '/creator/campaigns',
  })

  revalidatePath('/admin/verification-queue')
  revalidatePath(`/admin/verification-queue/${applicationId}`)
  revalidatePath(`/sponsor/verification-queue/${applicationId}`)
  revalidatePath('/sponsor/verification-queue')
  revalidatePath(`/creator/verification-queue/${applicationId}`)

  return { success: true }
}
