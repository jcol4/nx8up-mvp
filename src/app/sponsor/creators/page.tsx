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
    },
    orderBy: { subs_followers: 'desc' },
    take: 100,
  })

  // Sort by combined followers (Twitch + YouTube)
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
    mid:   'Mid',
    micro: 'Micro',
    nano:  'Nano',
  }

  const SIZE_COLOR: Record<string, string> = {
    large: 'border border-[#99f7ff]/35 bg-[#99f7ff]/10 text-[#99f7ff]',
    mid: 'border border-[#c084fc]/35 bg-[#c084fc]/10 text-[#d8b4fe]',
    micro: 'border border-[#22c55e]/35 bg-[#22c55e]/10 text-[#4ade80]',
    nano: 'border border-white/12 bg-white/5 text-[#a9abb5]',
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
    // Remove empty values
    for (const [k, v] of [...params.entries()]) {
      if (!v) params.delete(k)
    }
    const qs = params.toString()
    return `/sponsor/creators${qs ? `?${qs}` : ''}`
  }

  const filterClass = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'border-[#99f7ff]/40 bg-[#99f7ff] text-slate-900'
        : 'border-white/10 bg-black/20 text-[#a9abb5] hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]'
    }`

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Header */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Creators</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Top Creators</h1>
            <p className="mt-1 text-sm text-[#a9abb5]">
              {ranked.length} available creator{ranked.length !== 1 ? 's' : ''}, ranked by total reach
            </p>
          </div>

          {/* Filters */}
          <div className="dash-panel dash-panel--nx-top rounded-xl p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap gap-4">
              <div className="flex flex-wrap gap-1.5">
                <a href={buildUrl({ platform: '' })} className={filterClass(!platform)}>All platforms</a>
                <a href={buildUrl({ platform: 'twitch' })} className={filterClass(normalizedPlatform === 'twitch')}>Twitch</a>
                <a href={buildUrl({ platform: 'youtube' })} className={filterClass(normalizedPlatform === 'youtube')}>YouTube</a>
              </div>
              <div
                className="hidden h-9 w-px self-center rounded-full bg-[#99f7ff]/28 sm:block"
                aria-hidden
              />
              <div className="flex flex-wrap gap-1.5">
                <a href={buildUrl({ size: '' })} className={filterClass(!size)}>All sizes</a>
                {['large', 'mid', 'micro', 'nano'].map(s => (
                  <a key={s} href={buildUrl({ size: s })} className={filterClass(size === s)}>
                    {SIZE_LABEL[s]}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* List */}
          {ranked.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-10 text-center">
              <p className="text-sm text-[#a9abb5]">No creators match these filters.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/25">
                    <th className="w-6 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">#</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Creator</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Platforms</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Followers</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Avg views</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">CTR</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Content</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                        i === ranked.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3 text-xs tabular-nums text-[#6b7280]">
                        {i + 1}
                      </td>

                      {/* Creator */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/sponsor/creators/${c.id}`}
                          className="inline-block font-medium text-[#e8f4ff] transition-colors hover:text-[#99f7ff]"
                        >
                          {c.handle ?? <span className="italic text-[#6b7280]">No handle</span>}
                        </Link>
                        {c.location && (
                          <p className="mt-0.5 text-xs text-[#8f97ab]">{c.location}</p>
                        )}
                        {c.game_category.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {c.game_category.slice(0, 2).map(g => (
                              <span key={g} className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-1.5 py-0.5 text-[11px] text-[#d8b4fe]">{g}</span>
                            ))}
                            {c.game_category.length > 2 && (
                              <span className="text-[11px] text-[#6b7280]">+{c.game_category.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Platforms */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.platform.map(p => (
                            <span
                              key={p}
                              className={`rounded px-1.5 py-0.5 text-[11px] ${
                                PLATFORM_COLOR[p.toLowerCase()] ?? 'border border-white/10 bg-white/5 text-[#a9abb5]'
                              }`}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Followers */}
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold tabular-nums text-[#e8f4ff]">
                          {c.totalFollowers > 0 ? c.totalFollowers.toLocaleString() : '—'}
                        </p>
                        {c.subs_followers != null && c.youtube_subscribers != null && (
                          <p className="mt-0.5 text-[11px] tabular-nums text-[#8f97ab]">
                            {c.subs_followers.toLocaleString()} / {c.youtube_subscribers.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Avg views */}
                      <td className="px-4 py-3 text-right tabular-nums text-[#a9abb5]">
                        {c.avgViews != null ? c.avgViews.toLocaleString() : '—'}
                      </td>

                      {/* CTR */}
                      <td className="px-4 py-3 text-right">
                        {c.engagement_rate != null ? (
                          <span className={`text-xs font-medium tabular-nums ${
                            Number(c.engagement_rate) >= 5 ? 'text-[#22c55e]' :
                            Number(c.engagement_rate) >= 2 ? 'text-[#eab308]' : 'text-[#a9abb5]'
                          }`}>
                            {Number(c.engagement_rate).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#a9abb5]">—</span>
                        )}
                      </td>

                      {/* Content types */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.content_type.slice(0, 2).map(t => (
                            <span key={t} className="rounded border border-white/10 bg-black/20 px-1.5 py-0.5 text-[11px] text-[#a9abb5]">{t}</span>
                          ))}
                          {c.content_type.length > 2 && (
                            <span className="text-[11px] text-[#6b7280]">+{c.content_type.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3">
                        {c.creator_size ? (
                          <span className={`rounded px-2 py-0.5 text-[11px] capitalize ${SIZE_COLOR[c.creator_size] ?? 'border border-white/10 bg-white/5 text-[#a9abb5]'}`}>
                            {SIZE_LABEL[c.creator_size] ?? c.creator_size}
                          </span>
                        ) : (
                          <span className="text-xs text-[#a9abb5]">—</span>
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
