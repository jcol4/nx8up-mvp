import { prisma } from '@/lib/prisma'
import type { NotificationRole, NotificationType } from '@/lib/notification-types'

export type CreateNotificationInput = {
  userId: string
  role: NotificationRole
  type: NotificationType
  title: string
  message: string
  link?: string
  dedupeKey?: string
  sendEmail?: boolean
  emailAddress?: string
}

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
