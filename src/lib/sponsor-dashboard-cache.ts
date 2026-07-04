import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { matchCreatorToCampaign } from '@/lib/matching'

function formatCompactFollowers(value: number | null): string {
  if (!value || value <= 0) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return value.toLocaleString()
}

export type SponsorMatchedCreatorPreview = {
  id: string
  username: string
  categories: string[]
  followers: string
  matchScore: number
  eligible: boolean
  href: string
}

export type SponsorGettingStartedData = {
  profileComplete: boolean
  hasCampaign: boolean
  hasApplications: boolean
  hasPaidApplication: boolean
}

/** Use with `revalidateTag(sponsorDashboardCacheTag(sponsorId))` after sponsor mutations. */
export function sponsorDashboardCacheTag(sponsorId: string) {
  return `sponsor-dashboard:${sponsorId}`
}

export function getSponsorKpiCached(sponsorId: string) {
  return unstable_cache(
    async () => {
      const [liveCampaigns, campaignCount, budgetAgg, liveBudgetAgg, acceptedApps, totalApps] =
        await Promise.all([
          prisma.campaigns.count({
            where: { sponsor_id: sponsorId, status: 'live' },
          }),
          prisma.campaigns.count({
            where: { sponsor_id: sponsorId },
          }),
          prisma.campaigns.aggregate({
            where: { sponsor_id: sponsorId },
            _sum: { budget: true },
          }),
          prisma.campaigns.aggregate({
            where: { sponsor_id: sponsorId, status: 'live' },
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
      const liveBudget = liveBudgetAgg._sum.budget ?? 0
      const acceptanceRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0

      return {
        liveCampaigns,
        campaignCount,
        totalBudget,
        liveBudget,
        acceptedApps,
        totalApps,
        acceptanceRate,
      }
    },
    ['sponsor-dashboard-kpi', sponsorId],
    { revalidate: 20, tags: [sponsorDashboardCacheTag(sponsorId)] },
  )()
}

export function getSponsorGettingStartedCached(sponsorId: string) {
  return unstable_cache(
    async (): Promise<SponsorGettingStartedData> => {
      const [sponsor, campaignCount, applicationsCount, paidCount] = await Promise.all([
        prisma.sponsors.findUnique({
          where: { id: sponsorId },
          select: { company_name: true, platform: true },
        }),
        prisma.campaigns.count({ where: { sponsor_id: sponsorId } }),
        prisma.campaign_applications.count({
          where: { campaign: { sponsor_id: sponsorId } },
        }),
        prisma.campaign_applications.count({
          where: {
            campaign: { sponsor_id: sponsorId },
            status: { in: ['accepted', 'payout_due', 'paid', 'completed'] },
          },
        }),
      ])

      return {
        profileComplete: !!(sponsor?.company_name && sponsor.platform.length > 0),
        hasCampaign: campaignCount > 0,
        hasApplications: applicationsCount > 0,
        hasPaidApplication: paidCount > 0,
      }
    },
    ['sponsor-dashboard-getting-started', sponsorId],
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

export function getSponsorMatchedCreatorsPreviewCached(sponsorId: string) {
  return unstable_cache(
    async (): Promise<{ hasBaseCampaign: boolean; topMatches: SponsorMatchedCreatorPreview[] }> => {
      const baseCampaign = await prisma.campaigns.findFirst({
        where: {
          sponsor_id: sponsorId,
          status: { in: ['live', 'launched', 'pending_payment'] },
        },
        orderBy: { created_at: 'desc' },
        select: {
          platform: true,
          min_subs_followers: true,
          min_avg_viewers: true,
          min_engagement_rate: true,
          min_audience_age: true,
          max_audience_age: true,
          required_audience_locations: true,
          required_audience_regions: true,
          target_genders: true,
          target_interests: true,
          creator_types: true,
          creator_sizes: true,
          game_category: true,
          content_type: true,
          campaign_type: true,
          product_type: true,
        },
      })

      if (!baseCampaign) {
        return { hasBaseCampaign: false, topMatches: [] }
      }

      const creators = await prisma.content_creators.findMany({
        where: { is_available: true, is_deleted: false },
        select: {
          id: true,
          twitch_username: true,
          youtube_handle: true,
          youtube_channel_name: true,
          subs_followers: true,
          youtube_subscribers: true,
          platform: true,
          game_category: true,
          content_type: true,
          average_vod_views: true,
          youtube_avg_views: true,
          engagement_rate: true,
          audience_age_min: true,
          audience_age_max: true,
          audience_locations: true,
          audience_regions: true,
          audience_gender: true,
          audience_interests: true,
          creator_types: true,
          creator_size: true,
          preferred_campaign_types: true,
          preferred_product_types: true,
          is_available: true,
        },
        take: 200,
      })

      const topMatches = creators
        .map((creator) => {
          const match = matchCreatorToCampaign(creator, baseCampaign)
          const username =
            creator.twitch_username ??
            creator.youtube_handle ??
            creator.youtube_channel_name ??
            'Creator'
          const totalFollowers = (creator.subs_followers ?? 0) + (creator.youtube_subscribers ?? 0)
          return {
            id: creator.id,
            username,
            categories:
              creator.game_category.length > 0 ? creator.game_category : creator.content_type,
            followers: formatCompactFollowers(totalFollowers),
            matchScore: match.score,
            eligible: match.eligible,
            href: `/sponsor/creators/${creator.id}`,
          }
        })
        .sort((a, b) => {
          if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
          return b.matchScore - a.matchScore
        })
        .slice(0, 3)

      return { hasBaseCampaign: true, topMatches }
    },
    ['sponsor-dashboard-matched-creators', sponsorId],
    { revalidate: 20, tags: [sponsorDashboardCacheTag(sponsorId)] },
  )()
}
