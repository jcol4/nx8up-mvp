import { prisma } from './prisma'

/**
 * Recomputes a creator's click-through rate from real link_clicks data and
 * writes the result to content_creators.engagement_rate (stored as a
 * percentage, e.g. 2.5 = 2.5%).
 *
 * Formula:
 *   CTR = (total clicks across all campaigns) /
 *         (creator avg reach × number of campaigns with tracking) × 100
 *
 * Called fire-and-forget from the /r/[code] redirect route after each click.
 */
export async function recomputeCreatorCtr(creatorId: string): Promise<void> {
  const creator = await prisma.content_creators.findUnique({
    where: { id: creatorId },
    select: {
      average_vod_views: true,
      youtube_avg_views: true,
      subs_followers: true,
      youtube_subscribers: true,
      applications: {
        where: { tracking_short_code: { not: null } },
        select: {
          _count: { select: { link_clicks: true } },
        },
      },
    },
  })

  if (!creator) return

  // Use the best available reach metric as the per-campaign impression estimate
  const reach =
    creator.average_vod_views ??
    creator.youtube_avg_views ??
    creator.subs_followers ??
    creator.youtube_subscribers

  if (!reach || reach === 0) return

  const campaignsWithTracking = creator.applications
  const numCampaigns = campaignsWithTracking.length
  if (numCampaigns === 0) return

  const totalClicks = campaignsWithTracking.reduce(
    (sum, app) => sum + app._count.link_clicks,
    0,
  )

  // Cap at Decimal(5,2) max to avoid DB errors
  const ctr = Math.min((totalClicks / (reach * numCampaigns)) * 100, 999.99)

  await prisma.content_creators.update({
    where: { id: creatorId },
    data: { engagement_rate: ctr },
  })
}
