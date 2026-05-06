import { NextResponse } from 'next/server'
import { applyLatePenalties } from '@/lib/late-penalties'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await applyLatePenalties()
  return NextResponse.json({ ok: true })
}
