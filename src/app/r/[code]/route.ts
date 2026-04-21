/**
 * @file r/[code]/route.ts
 * @description Tracking short-link redirect handler.
 *
 * URL pattern: GET /r/:code
 *
 * Responsibilities:
 * - Resolves a campaign application's short code to the campaign's landing page URL.
 * - Records a unique link click in `link_clicks`, deduplicating by IP hash so that
 *   the same visitor clicking the same link multiple times counts as one click.
 * - Redirects the visitor to the campaign landing page regardless of whether the
 *   click was already recorded (deduplication only skips the DB write, not the redirect).
 *
 * Privacy:
 * - Raw IP addresses are never persisted; only a SHA-256 hash is stored.
 * - IP is read from X-Forwarded-For (first hop) then X-Real-IP, then falls back to
 *   null when neither header is present (e.g. direct connections in development).
 *
 * External services: Prisma / PostgreSQL
 *
 * Gotchas:
 * - The DB write (`link_clicks.create`) is fire-and-forget; failures are silently
 *   swallowed (.catch(() => {})). A missed click is acceptable to keep latency low.
 * - If the landing page URL is stored without a protocol prefix it is normalised to
 *   https://. Mixed http/https normalisation is intentional.
 * - When `ip_hash` is null (no IP header present) deduplication is skipped entirely,
 *   meaning bot traffic without IP headers can inflate click counts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Handles GET /r/:code — resolves the short code, records the click, and redirects.
 *
 * @param req    - The incoming Next.js request (used for IP and User-Agent headers).
 * @param params - Route params; `code` is the unique tracking short code stored on
 *                 the campaign application.
 * @returns 302 redirect to the campaign landing page, or 404 JSON if the code is
 *          unknown / the campaign has no landing page configured.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  const application = await prisma.campaign_applications.findUnique({
    where: { tracking_short_code: code },
    select: {
      id: true,
      creator_id: true,
      campaign: { select: { landing_page_url: true } },
    },
  })

  if (!application?.campaign.landing_page_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Hash the IP for privacy — we never store the raw address
  const rawIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  const ipHash = rawIp
    ? createHash('sha256').update(rawIp).digest('hex')
    : null

  const dest = application.campaign.landing_page_url
  const url = /^https?:\/\//i.test(dest) ? dest : `https://${dest}`

  // Deduplicate by ip_hash — same IP clicking the same link is one click
  if (ipHash) {
    const duplicate = await prisma.link_clicks.findFirst({
      where: { application_id: application.id, ip_hash: ipHash },
      select: { id: true },
    })
    if (duplicate) {
      return NextResponse.redirect(url, { status: 302 })
    }
  }

  // Fire-and-forget — don't block the redirect on the DB write
  prisma.link_clicks
    .create({
      data: {
        application_id: application.id,
        ip_hash: ipHash,
        user_agent: req.headers.get('user-agent'),
        referrer: req.headers.get('referer'),
      },
    })
    .catch(() => {})

  return NextResponse.redirect(url, { status: 302 })
}
