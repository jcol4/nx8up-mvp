import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NxHudCard from '@/components/nx-shell/NxHudCard'

function formatNum(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

export default async function SponsorCreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const creator = await prisma.content_creators.findUnique({
    where: { id },
    select: {
      id: true,
      twitch_username: true,
      youtube_handle: true,
      youtube_channel_name: true,
      location: true,
      platform: true,
      creator_size: true,
      creator_types: true,
      game_category: true,
      content_type: true,
      subs_followers: true,
      youtube_subscribers: true,
      average_vod_views: true,
      youtube_avg_views: true,
      engagement_rate: true,
      audience_age_min: true,
      audience_age_max: true,
      audience_locations: true,
      audience_gender: true,
      audience_interests: true,
      is_available: true,
      steam_id: true,
      steam_username: true,
    },
  })

  if (!creator) notFound()

  const displayName =
    creator.twitch_username ?? creator.youtube_handle ?? creator.youtube_channel_name ?? 'Creator'
  const totalFollowers = (creator.subs_followers ?? 0) + (creator.youtube_subscribers ?? 0)

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-5 sm:p-6">
      <div className="flex items-center justify-start">
        <Link
          href="/sponsor/creators"
          className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/45 bg-[#99f7ff]/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/70 hover:bg-[#99f7ff]/20 hover:text-[#e9fdff]"
        >
          <span aria-hidden>&larr;</span>
          Back to Creators
        </Link>
      </div>

      <NxHudCard as="div" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-0.5 text-[11px] text-[#99f7ff]">
                {creator.is_available ? 'Available' : 'Unavailable'}
              </span>
              {creator.creator_size && (
                <span className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-[11px] capitalize text-[#a9abb5]">
                  {creator.creator_size}
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-[#e8f4ff]">{displayName}</h1>
            <p className="mt-1 text-sm text-[#a9abb5]">{creator.location ?? 'Location not set'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#99f7ff]">{formatNum(totalFollowers)}</p>
            <p className="text-[11px] text-[#a9abb5]">total followers</p>
          </div>
        </div>
      </NxHudCard>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <NxHudCard as="section" className="p-5">
            <h2 className="dash-panel-title">Creator Profile</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a9abb5]">Platforms</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {creator.platform.map((p) => (
                    <span key={p} className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-xs text-[#e8f4ff]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a9abb5]">Creator Types</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {creator.creator_types.length > 0 ? creator.creator_types.map((type) => (
                    <span key={type} className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-xs text-[#e8f4ff]">
                      {type}
                    </span>
                  )) : <span className="text-xs text-[#a9abb5]">—</span>}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a9abb5]">Game Categories</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {creator.game_category.length > 0 ? creator.game_category.map((g) => (
                    <span key={g} className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]">
                      {g}
                    </span>
                  )) : <span className="text-xs text-[#a9abb5]">—</span>}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#a9abb5]">Content Types</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {creator.content_type.length > 0 ? creator.content_type.map((t) => (
                    <span key={t} className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]">
                      {t}
                    </span>
                  )) : <span className="text-xs text-[#a9abb5]">—</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[#a9abb5]">Steam</p>
                <div className="mt-1.5">
                  {creator.steam_id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded border border-[#66c0f4]/35 bg-[#66c0f4]/10 px-2 py-0.5 text-xs text-[#bcdcf2]">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#66c0f4">
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.083 3.166 9.426 7.626 11.166l-.082-.041 3.547-1.452a3.375 3.375 0 1 0 4.064-4.86l3.6-2.594.139.001a4.5 4.5 0 1 0-4.5-4.5v.054l-2.586 3.745a3.376 3.376 0 0 0-2.748.92L0 12c.001 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm-2.18 17.85l-1.13.464a2.531 2.531 0 1 0 1.466-3.34l1.166-.484c1.288.504 1.913 1.967 1.387 3.275-.523 1.288-1.967 1.913-3.275 1.387l.386-.302zm9.105-7.34a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                        </svg>
                        {creator.steam_username ?? 'Connected'}
                      </span>
                      <span className="font-mono text-[11px] text-[#a9abb5]">{creator.steam_id}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#a9abb5]">— Not connected</span>
                  )}
                </div>
              </div>
            </div>
          </NxHudCard>
        </div>

        <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <NxHudCard as="div" className="p-4">
            <h3 className="dash-panel-title">Performance</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="dash-text-muted">Twitch followers</dt>
                <dd className="dash-text-bright">{formatNum(creator.subs_followers)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="dash-text-muted">YouTube subscribers</dt>
                <dd className="dash-text-bright">{formatNum(creator.youtube_subscribers)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="dash-text-muted">Avg views</dt>
                <dd className="dash-text-bright">
                  {formatNum(Math.max(creator.average_vod_views ?? 0, creator.youtube_avg_views ?? 0) || null)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="dash-text-muted">Engagement</dt>
                <dd className="text-[#99f7ff]">
                  {creator.engagement_rate != null ? `${Number(creator.engagement_rate).toFixed(1)}%` : '—'}
                </dd>
              </div>
            </dl>
          </NxHudCard>

          <NxHudCard as="div" className="p-4">
            <h3 className="dash-panel-title">Audience</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="dash-text-muted">Age range</dt>
                <dd className="dash-text-bright">
                  {creator.audience_age_min != null && creator.audience_age_max != null
                    ? `${creator.audience_age_min}-${creator.audience_age_max}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="dash-text-muted mb-1">Locations</dt>
                <dd className="flex flex-wrap gap-1">
                  {creator.audience_locations.length > 0 ? creator.audience_locations.map((loc) => (
                    <span key={loc} className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-xs text-[#a9abb5]">
                      {loc}
                    </span>
                  )) : <span className="text-xs text-[#a9abb5]">—</span>}
                </dd>
              </div>
              <div>
                <dt className="dash-text-muted mb-1">Interests</dt>
                <dd className="flex flex-wrap gap-1">
                  {creator.audience_interests.length > 0 ? creator.audience_interests.slice(0, 8).map((interest) => (
                    <span key={interest} className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-xs text-[#a9abb5]">
                      {interest}
                    </span>
                  )) : <span className="text-xs text-[#a9abb5]">—</span>}
                </dd>
              </div>
            </dl>
          </NxHudCard>
        </div>
      </div>
    </main>
  )
}