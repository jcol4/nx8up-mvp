import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../SponsorHeader'

type Props = {
  searchParams: Promise<{ platform?: string; size?: string }>
}

export default async function SponsorCreatorsPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { platform, size } = await searchParams

  const creators = await prisma.content_creators.findMany({
    where: {
      is_available: true,
      ...(platform ? { platform: { has: platform } } : {}),
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
    large: 'bg-[#00c8ff]/10 text-[#00c8ff]',
    mid:   'bg-[#7b4fff]/10 text-[#7b4fff]',
    micro: 'bg-[#22c55e]/10 text-[#22c55e]',
    nano:  'bg-[#94a3b8]/10 text-[#94a3b8]',
  }

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(platform ? { platform } : {}),
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
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      active ? 'bg-[#00c8ff] text-black' : 'dash-panel dash-text-muted hover:dash-text-bright'
    }`

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold dash-text-bright">Top Creators</h1>
            <p className="text-sm dash-text-muted mt-1">
              {ranked.length} available creator{ranked.length !== 1 ? 's' : ''}, ranked by total reach
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-1.5">
              <a href={buildUrl({ platform: '' })} className={filterClass(!platform)}>All platforms</a>
              <a href={buildUrl({ platform: 'Twitch' })} className={filterClass(platform === 'Twitch')}>Twitch</a>
              <a href={buildUrl({ platform: 'YouTube' })} className={filterClass(platform === 'YouTube')}>YouTube</a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <a href={buildUrl({ size: '' })} className={filterClass(!size)}>All sizes</a>
              {['large', 'mid', 'micro', 'nano'].map(s => (
                <a key={s} href={buildUrl({ size: s })} className={filterClass(size === s)}>
                  {SIZE_LABEL[s]}
                </a>
              ))}
            </div>
          </div>

          {/* List */}
          {ranked.length === 0 ? (
            <div className="dash-panel p-10 text-center">
              <p className="dash-text-muted text-sm">No creators match these filters.</p>
            </div>
          ) : (
            <div className="dash-panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 dash-text-muted font-medium w-6">#</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Creator</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Platforms</th>
                    <th className="text-right px-4 py-3 dash-text-muted font-medium">Followers</th>
                    <th className="text-right px-4 py-3 dash-text-muted font-medium">Avg views</th>
                    <th className="text-right px-4 py-3 dash-text-muted font-medium">Engagement</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Content</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Size</th>
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
                      <td className="px-4 py-3 text-xs dash-text-muted tabular-nums">
                        {i + 1}
                      </td>

                      {/* Creator */}
                      <td className="px-4 py-3">
                        <p className="dash-text-bright font-medium">
                          {c.handle ?? <span className="dash-text-muted italic">No handle</span>}
                        </p>
                        {c.location && (
                          <p className="text-xs dash-text-muted mt-0.5">{c.location}</p>
                        )}
                        {c.game_category.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.game_category.slice(0, 2).map(g => (
                              <span key={g} className="text-[11px] px-1.5 py-0.5 rounded bg-[#7b4fff]/10 text-[#7b4fff]">{g}</span>
                            ))}
                            {c.game_category.length > 2 && (
                              <span className="text-[11px] dash-text-muted">+{c.game_category.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Platforms */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.platform.map(p => (
                            <span key={p} className="text-[11px] px-1.5 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{p}</span>
                          ))}
                        </div>
                      </td>

                      {/* Followers */}
                      <td className="px-4 py-3 text-right">
                        <p className="dash-text-bright font-semibold tabular-nums">
                          {c.totalFollowers > 0 ? c.totalFollowers.toLocaleString() : '—'}
                        </p>
                        {c.subs_followers != null && c.youtube_subscribers != null && (
                          <p className="text-[11px] dash-text-muted mt-0.5 tabular-nums">
                            {c.subs_followers.toLocaleString()} / {c.youtube_subscribers.toLocaleString()}
                          </p>
                        )}
                      </td>

                      {/* Avg views */}
                      <td className="px-4 py-3 text-right dash-text-muted tabular-nums">
                        {c.avgViews != null ? c.avgViews.toLocaleString() : '—'}
                      </td>

                      {/* Engagement */}
                      <td className="px-4 py-3 text-right">
                        {c.engagement_rate != null ? (
                          <span className={`text-xs font-medium tabular-nums ${
                            Number(c.engagement_rate) >= 5 ? 'text-[#22c55e]' :
                            Number(c.engagement_rate) >= 2 ? 'text-[#eab308]' : 'dash-text-muted'
                          }`}>
                            {Number(c.engagement_rate).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="dash-text-muted">—</span>
                        )}
                      </td>

                      {/* Content types */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.content_type.slice(0, 2).map(t => (
                            <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 dash-text-muted">{t}</span>
                          ))}
                          {c.content_type.length > 2 && (
                            <span className="text-[11px] dash-text-muted">+{c.content_type.length - 2}</span>
                          )}
                        </div>
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3">
                        {c.creator_size ? (
                          <span className={`text-[11px] px-2 py-0.5 rounded capitalize ${SIZE_COLOR[c.creator_size] ?? 'bg-white/5 dash-text-muted'}`}>
                            {SIZE_LABEL[c.creator_size] ?? c.creator_size}
                          </span>
                        ) : (
                          <span className="dash-text-muted text-xs">—</span>
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
