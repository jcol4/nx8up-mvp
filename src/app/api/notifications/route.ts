import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 20

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE), 50)

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = notifications.length > limit
  const items = hasMore ? notifications.slice(0, limit) : notifications

  return Response.json({
    notifications: items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  })
}

export async function PATCH() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })

  return Response.json({ success: true })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.deleteMany({
    where: { userId, read: true },
  })

  return Response.json({ success: true })
}
