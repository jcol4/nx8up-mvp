import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const ADMIN_DASHBOARD_CACHE_TAG = 'admin-dashboard'

export function getAdminKpisCached() {
  return unstable_cache(
    async () => {
      const [campaigns, liveCampaigns, submittedDeals, creators, sponsors] = await Promise.all([
        prisma.campaigns.count(),
        prisma.campaigns.count({ where: { status: 'live' } }),
        prisma.deal_submissions.count({ where: { status: 'submitted' } }),
        prisma.content_creators.count(),
        prisma.sponsors.count(),
      ])
      return { campaigns, liveCampaigns, submittedDeals, creators, sponsors }
    },
    ['admin-kpis'],
    { revalidate: 20, tags: [ADMIN_DASHBOARD_CACHE_TAG] },
  )()
}

/** Sidebar “Platform Overview” — same source as dashboard KPIs. */
export function getAdminPlatformOverviewCached() {
  return getAdminKpisCached()
}
