/**
 * /api/notifications/preferences
 *
 * GET   — Returns the current user's notification preference map.
 *          Response: { prefs: Record<NotificationType, boolean> }
 *          Falls back to {} if no preferences have been saved yet.
 *
 * PATCH — Upserts the full preference map for the current user.
 *          Body: Record<NotificationType, boolean>
 *          Response: { prefs: Record<NotificationType, boolean> }
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/** Returns the authenticated user's saved notification preferences, or {} if none set. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const pref = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  return Response.json({ prefs: pref?.prefs ?? {} })
}

/** Saves (upserts) the full notification preference map for the current user. */
export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }

  const pref = await prisma.notificationPreference.upsert({
    where: { userId },
    update: { prefs: body },
    create: { userId, prefs: body },
  })

  return Response.json({ prefs: pref.prefs })
}
