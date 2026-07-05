/**
 * Cron endpoint authorization — one guard for the `Authorization: Bearer <CRON_SECRET>`
 * check that Vercel Cron sends.
 *
 * This check was inlined identically in every cron route. Centralizing it also closes two
 * gaps the inline version had:
 *   - **Fail closed** when `CRON_SECRET` is unset. The old `Bearer ${process.env.CRON_SECRET}`
 *     template silently became the literal string `"Bearer undefined"`, so a request sending
 *     exactly that header would have been accepted. A missing secret now returns 500.
 *   - **Constant-time compare** so the secret can't be recovered from response timing.
 */
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

/** Length-checked constant-time string comparison (avoids `timingSafeEqual`'s length throw). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/**
 * Pure authorization decision for a cron request — the test surface for the guard.
 * `'misconfigured'` = the server has no `CRON_SECRET`; `'unauthorized'` = wrong/absent bearer.
 */
export function cronAuthStatus(req: Request): 'ok' | 'unauthorized' | 'misconfigured' {
  const secret = process.env.CRON_SECRET
  if (!secret) return 'misconfigured'
  const header = req.headers.get('authorization') ?? ''
  return safeEqual(header, `Bearer ${secret}`) ? 'ok' : 'unauthorized'
}

/**
 * Guards a cron route. Returns a `NextResponse` to send back when the request must be
 * rejected, or `null` when it is authorized and may proceed:
 *
 *     const denied = assertCronRequest(req)
 *     if (denied) return denied
 */
export function assertCronRequest(req: Request): NextResponse | null {
  switch (cronAuthStatus(req)) {
    case 'ok':
      return null
    case 'misconfigured':
      console.error('CRON_SECRET is not set — refusing cron request')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    case 'unauthorized':
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
