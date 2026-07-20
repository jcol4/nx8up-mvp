/**
 * @file r/c/[code]/route.ts
 * @description Creator affiliate-link redirect handler.
 *
 * URL pattern: GET /r/c/:code
 *
 * Resolves a creator's `referral_code`, stamps a `nx8_ref` cookie identifying
 * the referrer, and redirects to sign-up. Attribution is completed later in
 * `completeOnboarding` (src/app/[locale]/onboarding/_actions.ts), which reads
 * the cookie once the referred creator's account row is created.
 *
 * `/r/` is already exempted from i18n middleware (see src/proxy.ts), so this
 * nested route needs no additional middleware changes.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const REFERRAL_COOKIE = 'nx8_ref'
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const referrer = await prisma.content_creators.findUnique({
    where: { referral_code: code },
    select: { id: true },
  })

  if (!referrer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const res = NextResponse.redirect(new URL('/sign-up', req.url), { status: 302 })
  res.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  })
  return res
}
