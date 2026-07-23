import { NextResponse } from 'next/server'
import { applyLatePenalties } from '@/lib/late-penalties'
import { assertCronRequest } from '@/lib/cron-auth'

export const maxDuration = 60

export async function GET(req: Request) {
  const denied = assertCronRequest(req)
  if (denied) return denied

  await applyLatePenalties()
  return NextResponse.json({ ok: true })
}
