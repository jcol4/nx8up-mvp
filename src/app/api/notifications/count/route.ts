import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ unread: 0 })

  const unread = await prisma.notification.count({
    where: { userId, read: false },
  })

  return Response.json({ unread })
}
