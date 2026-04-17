import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const pref = await prisma.notificationPreference.findUnique({
    where: { userId },
  })

  return Response.json({ prefs: pref?.prefs ?? {} })
}

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
