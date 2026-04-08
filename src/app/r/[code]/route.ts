import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { recomputeCreatorCtr } from '@/lib/ctr'

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
    .then(() => recomputeCreatorCtr(application.creator_id))
    .catch(() => {})

  const dest = application.campaign.landing_page_url
  const url = /^https?:\/\//i.test(dest) ? dest : `https://${dest}`

  return NextResponse.redirect(url, { status: 302 })
}
