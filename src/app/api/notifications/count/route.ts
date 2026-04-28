/**
 * GET /api/notifications/count
 *
 * Returns the count of unread notifications for the current user.
 * Returns { unread: 0 } (not 401) for unauthenticated requests so the
 * notification bell can render without a loading error.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/** Returns { unread: number } for the authenticated user's notification bell. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ unread: 0 })

  try {
    const unread = await prisma.notification.count({
      where: { userId, read: false },
    })

    return Response.json({ unread })
  } catch (error) {
    console.error('Notifications count query failed:', error)
    // Keep the UI stable during transient DB timeouts.
    return Response.json({ unread: 0 })
  }
}
