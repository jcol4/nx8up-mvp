import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { DashboardPanel } from '@/components/dashboard'
import { prisma } from '@/lib/prisma'
import { matchCreatorToCampaign } from '@/lib/matching'

function formatCompactFollowers(value: number | null): string {
  if (!value || value <= 0) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return value.toLocaleString()
}

export default async function SponsorMatchedCreatorsSection() {
  const { userId } = await auth()
  if (!userId) {
    return (
      <DashboardPanel title="Matched Creators" href="/sponsor/creators" linkLabel="Browse all">
        <p className="text-sm dash-text-muted">Sign in to see creator matches.</p>
      </DashboardPanel>
    )
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })

  if (!sponsor?.id) {
    return (
      <DashboardPanel title="Matched Creators" href="/sponsor/creators" linkLabel="Browse all">
        <p className="text-sm dash-text-muted">Complete your sponsor setup to see creator matches.</p>
      </DashboardPanel>
    )
  }

  const baseCampaign = await prisma.campaigns.findFirst({
    where: {
      sponsor_id: sponsor.id,
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
    return (
      <DashboardPanel title="Matched Creators" href="/sponsor/creators" linkLabel="Browse all">
        <p className="text-xs dash-text-muted mb-2">Post a campaign to unlock matched creators.</p>
        <Link href="/sponsor/campaigns/new" className="text-xs dash-accent hover:underline">
          Create a campaign →
        </Link>
      </DashboardPanel>
    )
  }

  const creators = await prisma.content_creators.findMany({
    where: { is_available: true },
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
      const username = creator.twitch_username ?? creator.youtube_handle ?? creator.youtube_channel_name ?? 'Creator'
      const totalFollowers = (creator.subs_followers ?? 0) + (creator.youtube_subscribers ?? 0)
      return {
        id: creator.id,
        username,
        categories: creator.game_category.length > 0 ? creator.game_category : creator.content_type,
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

  return (
    <DashboardPanel title="Matched Creators" href="/sponsor/creators" linkLabel="Browse all">
      <p className="text-xs dash-text-muted mb-3">
        Creators who match your campaign targeting criteria.
      </p>
      {topMatches.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-center text-xs dash-text-muted">
          No matching creators found yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
          {topMatches.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="block p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#99f7ff]/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 text-xs font-semibold text-[#99f7ff]">
                  {c.username.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-medium dash-text-bright">{c.username}</span>
                  <p className="truncate text-xs dash-text-muted mt-0.5">{c.categories.join(' · ')} · {c.followers}</p>
                </div>
              </div>
              <span className="text-xs dash-accent font-semibold">{c.matchScore}% match</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#99f7ff] to-[#d873ff]"
                style={{ width: `${c.matchScore}%` }}
              />
            </div>
          </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
