import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assignWeeklyMissions } from '@/lib/mission-assignment'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creators = await prisma.content_creators.findMany({ select: { id: true } })
  await Promise.all(creators.map((c) => assignWeeklyMissions(c.id)))

  return NextResponse.json({ ok: true, assigned: creators.length })
}
