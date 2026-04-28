import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

/** Use with `revalidateTag(sponsorDashboardCacheTag(sponsorId))` after sponsor mutations. */
export function sponsorDashboardCacheTag(sponsorId: string) {
  return `sponsor-dashboard:${sponsorId}`
}

export function getSponsorKpiCached(sponsorId: string) {
  return unstable_cache(
    async () => {
      const [liveCampaigns, budgetAgg, acceptedApps, totalApps] = await Promise.all([
        prisma.campaigns.count({
          where: { sponsor_id: sponsorId, status: 'live' },
        }),
        prisma.campaigns.aggregate({
          where: { sponsor_id: sponsorId },
          _sum: { budget: true },
        }),
        prisma.campaign_applications.count({
          where: { status: 'accepted', campaign: { sponsor_id: sponsorId } },
        }),
        prisma.campaign_applications.count({
          where: { campaign: { sponsor_id: sponsorId } },
        }),
      ])

      const totalBudget = budgetAgg._sum.budget ?? 0
      const acceptanceRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0

      return {
        liveCampaigns,
        totalBudget,
        acceptedApps,
        totalApps,
        acceptanceRate,
      }
    },
    ['sponsor-dashboard-kpi', sponsorId],
    { revalidate: 20, tags: [sponsorDashboardCacheTag(sponsorId)] },
  )()
}

export function getSponsorMyCampaignsPreviewCached(sponsorId: string) {
  return unstable_cache(
    async () => {
      return prisma.campaigns.findMany({
        where: { sponsor_id: sponsorId },
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          status: true,
          game_category: true,
          budget: true,
          _count: { select: { applications: true } },
        },
      })
    },
    ['sponsor-dashboard-my-campaigns', sponsorId],
    { revalidate: 20, tags: [sponsorDashboardCacheTag(sponsorId)] },
  )()
}
