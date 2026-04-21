/**
 * Notification creation utility.
 *
 * Wraps DB insertion with optional deduplication and email delivery.
 * All failures are caught and logged silently so a notification error
 * never bubbles up and breaks the caller's primary operation.
 */
import { prisma } from '@/lib/prisma'
import type { NotificationRole, NotificationType } from '@/lib/notification-types'

/** Input for creating a single in-app (and optionally email) notification. */
export type CreateNotificationInput = {
  /** Clerk user ID of the recipient. */
  userId: string
  /** Whether the recipient is a 'creator' or 'sponsor' — used for dashboard routing. */
  role: NotificationRole
  /** Category of the notification (e.g. 'application_approved', 'payment_received'). */
  type: NotificationType
  /** Short notification headline shown in the notifications list. */
  title: string
  /** Full notification body text. */
  message: string
  /** Optional deep-link URL to render a "View Details" CTA in the notification. */
  link?: string
  /**
   * Optional idempotency key. If a notification with the same userId + type +
   * dedupeKey was created within the last 10 minutes, the new one is silently
   * skipped. Prevents duplicate notifications from retries or race conditions.
   */
  dedupeKey?: string
  /** If true, also send an email to `emailAddress` via Resend. */
  sendEmail?: boolean
  /** Recipient email address. Required when sendEmail is true. */
  emailAddress?: string
}

/**
 * Creates an in-app notification and, optionally, sends a corresponding email.
 * Returns the created notification record, or null if deduplicated or on error.
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    if (input.dedupeKey) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: input.userId,
          type: input.type,
          dedupeKey: input.dedupeKey,
          createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        select: { id: true },
      })
      if (existing) return null
    }

    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        role: input.role,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        dedupeKey: input.dedupeKey ?? null,
      },
    })

    if (input.sendEmail && input.emailAddress) {
      const { sendNotificationEmail } = await import('@/lib/email')
      await sendNotificationEmail({
        to: input.emailAddress,
        subject: input.title,
        title: input.title,
        message: input.message,
        link: input.link,
      })
    }

    return notification
  } catch (err) {
    console.error('[createNotification] failed silently:', err)
    return null
  }
}
