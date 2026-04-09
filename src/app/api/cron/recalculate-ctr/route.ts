import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeAndStoreSubmissionCtr, recomputeCreatorAggregateCtr } from '@/lib/ctr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/recalculate-ctr
 *
 * Called by Vercel Cron every 24 hours (see vercel.json).
 * For each deal_submission with proof URLs:
 *   1. Fetches current view counts from YouTube / Twitch via OAuth
 *   2. Computes CTR = (clicks / avg_video_views) * 100
 *   3. Stores result on deal_submissions.ctr
 * Then recomputes aggregate CTR for each affected creator (DB-only, no API calls).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Target submissions whose views haven't been fetched in the last 23h
  const cutoff = new Date(Date.now() - 23 * 60 * 60 * 1000)
  const submissions = await prisma.deal_submissions.findMany({
    where: {
      proof_urls: { isEmpty: false },
      OR: [{ views_fetched_at: null }, { views_fetched_at: { lt: cutoff } }],
    },
    select: {
      application_id: true,
      application: { select: { creator_id: true } },
    },
  })

  const affectedCreators = new Set<string>()
  let updated = 0
  let failed = 0

  for (const sub of submissions) {
    try {
      await computeAndStoreSubmissionCtr(sub.application_id)
      affectedCreators.add(sub.application.creator_id)
      updated++
    } catch (err) {
      console.error(`CTR cron: failed for application ${sub.application_id}`, err)
      failed++
    }
  }

  for (const creatorId of affectedCreators) {
    try {
      await recomputeCreatorAggregateCtr(creatorId)
    } catch (err) {
      console.error(`CTR cron: aggregate recompute failed for creator ${creatorId}`, err)
    }
  }

  return NextResponse.json({ updated, failed, creatorsUpdated: affectedCreators.size })
}
