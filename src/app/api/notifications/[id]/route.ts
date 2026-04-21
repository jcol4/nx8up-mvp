/**
 * /api/notifications/[id]
 *
 * PATCH  — Marks a single notification as read. Scoped to the current user
 *           (updateMany with userId guard prevents reading other users' notifications).
 *
 * DELETE — Permanently deletes a single notification. Scoped to the current user.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/** Marks the specified notification as read for the current user. */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  })

  return Response.json({ success: true })
}

/** Permanently deletes the specified notification for the current user. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await prisma.notification.deleteMany({
    where: { id, userId },
  })

  return Response.json({ success: true })
}
