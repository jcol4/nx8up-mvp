import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assignWeeklyMissions } from '@/lib/mission-assignment'
import { assertCronRequest } from '@/lib/cron-auth'

// Fans out assignWeeklyMissions across all creators; scales with creator count.
export const maxDuration = 300

export async function GET(req: Request) {
  const denied = assertCronRequest(req)
  if (denied) return denied

  const creators = await prisma.content_creators.findMany({ select: { id: true } })
  await Promise.all(creators.map((c) => assignWeeklyMissions(c.id)))

  return NextResponse.json({ ok: true, assigned: creators.length })
}
