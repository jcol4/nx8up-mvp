import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../_components/dashboard/SponsorHeader'

type Props = {
  searchParams: Promise<{ platform?: string; size?: string }>
}

export default async function SponsorCreatorsPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { platform, size } = await searchParams
  const normalizedPlatform = platform?.toLowerCase()

  const creators = await prisma.content_creators.findMany({
    where: {
      is_available: true,
      is_deleted: false,
      ...(normalizedPlatform
        ? {
            OR: [
              { platform: { has: normalizedPlatform } },
              { platform: { has: normalizedPlatform === 'twitch' ? 'Twitch' : 'YouTube' } },
            ],
          }
        : {}),
      ...(size ? { creator_size: size } : {}),
    },
    select: {
      id: true,
      twitch_username: true,
      youtube_handle: true,
      youtube_channel_name: true,
      subs_followers: true,
      youtube_subscribers: true,
      average_vod_views: true,
      youtube_avg_views: true,
      engagement_rate: true,
      platform: true,
      creator_size: true,
      creator_types: true,
      game_category: true,
      content_type: true,
      audience_locations: true,
      location: true,
      steam_id: true,
    },
    orderBy: { subs_followers: 'desc' },
    take: 100,
  })

  const ranked = creators
    .map(c => ({
      ...c,
      totalFollowers: (c.subs_followers ?? 0) + (c.youtube_subscribers ?? 0),
      avgViews: Math.max(c.average_vod_views ?? 0, c.youtube_avg_views ?? 0) || null,
      handle: c.twitch_username ?? c.youtube_handle ?? c.youtube_channel_name,
    }))
    .sort((a, b) => b.totalFollowers - a.totalFollowers)

  const SIZE_LABEL: Record<string, string> = {
    large: 'Large',
    mid: 'Mid',
    micro: 'Micro',
    nano: 'Nano',
  }

  const SIZE_COLOR: Record<string, string> = {
    large: 'border border-[#99f7ff]/35 bg-[#99f7ff]/10 text-[#99f7ff]',
    mid: 'border border-[#c084fc]/35 bg-[#c084fc]/10 text-[#d8b4fe]',
    micro: 'border border-[#22c55e]/35 bg-[#22c55e]/10 text-[#4ade80]',
    nano: 'border border-slate-400/35 bg-slate-500/15 text-slate-200',
  }

  const PLATFORM_COLOR: Record<string, string> = {
    youtube: 'border border-red-500/35 bg-red-500/10 text-red-300',
    twitch: 'border border-[#a970ff]/35 bg-[#a970ff]/12 text-[#d8b4fe]',
  }

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(normalizedPlatform ? { platform: normalizedPlatform } : {}),
      ...(size ? { size } : {}),
      ...overrides,
    })
    for (const [k, v] of [...params.entries()]) {
      if (!v) params.delete(k)
    }
    const qs = params.toString()
    return `/sponsor/creators${qs ? `?${qs}` : ''}`
  }

  const filterClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? 'border border-[#99f7ff]/45 bg-[#99f7ff]/12 text-[#bffcff]'
        : 'border border-white/12 bg-black/20 cr-text-muted hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]'
    }`

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-creators sponsor-creators-detail mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">Directory</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                Top Creators
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                Available creators ranked by combined Twitch and YouTube reach.
              </p>
            </div>
            <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
              <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                {ranked.length}
              </p>
              <p className="sp-app-stat-label mt-0.5">
                Creator{ranked.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="sp-app-stat-label mb-3">Filters</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-wrap gap-1.5">
                <a href={buildUrl({ platform: '' })} className={filterClass(!normalizedPlatform)}>
                  All platforms
                </a>
                <a href={buildUrl({ platform: 'twitch' })} className={filterClass(normalizedPlatform === 'twitch')}>
                  Twitch
                </a>
                <a href={buildUrl({ platform: 'youtube' })} className={filterClass(normalizedPlatform === 'youtube')}>
                  YouTube
                </a>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <a href={buildUrl({ size: '' })} className={filterClass(!size)}>
                  All sizes
                </a>
                {['large', 'mid', 'micro', 'nano'].map(s => (
                  <a key={s} href={buildUrl({ size: s })} className={filterClass(size === s)}>
                    {SIZE_LABEL[s]}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {ranked.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
              <p className="text-sm font-medium text-[#e8f4ff]">No creators match these filters</p>
              <p className="mt-1 text-sm cr-text-muted">
                Try clearing platform or size filters to see more creators.
              </p>
            </div>
          ) : (
            <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20">
              <table className="sp-creators-table w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="w-6 px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Creator</th>
                    <th className="px-4 py-3 text-left">Platforms</th>
                    <th className="px-4 py-3 text-right">Followers</th>
                    <th className="px-4 py-3 text-right">Avg views</th>
                    <th className="px-4 py-3 text-right">CTR</th>
                    <th className="px-4 py-3 text-left">Content</th>
                    <th className="px-4 py-3 text-left">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-white/5 ${
                        i === ranked.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-xs tabular-nums cr-stat-caption">
                        {i + 1}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/sponsor/creators/${c.id}`}
                          className="font-medium text-[#e8f4ff] hover:text-[#99f7ff]"
                        >
                          {c.handle ?? <span className="italic cr-stat-caption">No handle</span>}
                        </Link>
                        {c.location && (
                          <p className="mt-0.5 text-xs cr-stat-caption">{c.location}</p>
                        )}
                        {c.game_category.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.game_category.slice(0, 2).map(g => (
                              <span
                                key={g}
                                className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-1.5 py-0.5 text-nx-11 text-[#d8b4fe]"
                              >
                                {g}
                              </span>
                            ))}
                            {c.game_category.length > 2 && (
                              <span className="text-nx-11 cr-stat-caption">
                                +{c.game_category.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.platform.map(p => (
                            <span
                              key={p}
                              className={`rounded px-1.5 py-0.5 text-nx-11 ${
                                PLATFORM_COLOR[p.toLowerCase()] ??
                                'border border-white/12 bg-white/5 cr-text-muted'
                              }`}
                            >
                              {p}
                            </span>
                          ))}
                          {c.steam_id && (
                            <span className="rounded border border-[#66c0f4]/35 bg-[#66c0f4]/10 px-1.5 py-0.5 text-nx-11 text-[#bcdcf2]">
                              Steam
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold tabular-nums text-[#e8f4ff]">
                          {c.totalFollowers > 0 ? c.totalFollowers.toLocaleString() : '—'}
                        </p>
                        {c.subs_followers != null && c.youtube_subscribers != null && (
                          <p className="mt-0.5 text-nx-11 tabular-nums cr-stat-caption">
                            {c.subs_followers.toLocaleString()} / {c.youtube_subscribers.toLocaleString()}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums cr-text">
                        {c.avgViews != null ? c.avgViews.toLocaleString() : '—'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {c.engagement_rate != null ? (
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              Number(c.engagement_rate) >= 5
                                ? 'text-[#4ade80]'
                                : Number(c.engagement_rate) >= 2
                                  ? 'text-[#facc15]'
                                  : 'cr-stat-caption'
                            }`}
                          >
                            {Number(c.engagement_rate).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="cr-stat-caption">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.content_type.slice(0, 2).map(t => (
                            <span
                              key={t}
                              className="rounded border border-white/12 bg-white/5 px-1.5 py-0.5 text-nx-11 cr-text-muted"
                            >
                              {t}
                            </span>
                          ))}
                          {c.content_type.length > 2 && (
                            <span className="text-nx-11 cr-stat-caption">
                              +{c.content_type.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {c.creator_size ? (
                          <span
                            className={`rounded px-2 py-0.5 text-nx-11 capitalize ${
                              SIZE_COLOR[c.creator_size] ??
                              'border border-slate-400/35 bg-slate-500/15 text-slate-200'
                            }`}
                          >
                            {SIZE_LABEL[c.creator_size] ?? c.creator_size}
                          </span>
                        ) : (
                          <span className="text-xs cr-stat-caption">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
