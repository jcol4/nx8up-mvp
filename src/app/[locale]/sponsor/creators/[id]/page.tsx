import { notFound } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import NxHudCard from '@/components/nx-shell/NxHudCard'
import SponsorHeader from '../../_components/dashboard/SponsorHeader'

const SIZE_BADGE: Record<string, string> = {
  large: 'border border-[#99f7ff]/35 bg-[#99f7ff]/10 text-[#99f7ff]',
  mid: 'border border-[#c084fc]/35 bg-[#c084fc]/10 text-[#d8b4fe]',
  micro: 'border border-[#22c55e]/35 bg-[#22c55e]/10 text-[#4ade80]',
  nano: 'border border-slate-400/35 bg-slate-500/15 text-slate-200',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="sp-app-stat-label">{label}</p>
      <div className="sp-app-stat-value mt-1.5">{value}</div>
    </div>
  )
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="sp-app-stat-label shrink-0">{label}</span>
      <span className="sp-app-stat-value text-right">{children}</span>
    </div>
  )
}

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`rounded border border-white/12 bg-white/5 px-2 py-0.5 text-xs text-[#e8f4ff] ${className}`}
    >
      {children}
    </span>
  )
}

export default async function SponsorCreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const t = await getTranslations('sponsor.creators')
  const format = await getFormatter()
  const formatNum = (value: number | null): string => (value == null ? '—' : format.number(value))
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
      audience_interests: true,
      is_available: true,
      steam_id: true,
      steam_username: true,
    },
  })

  if (!creator) notFound()

  const displayName =
    creator.twitch_username ?? creator.youtube_handle ?? creator.youtube_channel_name ?? t('creatorFallback')
  const totalFollowers = (creator.subs_followers ?? 0) + (creator.youtube_subscribers ?? 0)
  const avgViews = Math.max(creator.average_vod_views ?? 0, creator.youtube_avg_views ?? 0) || null
  const sizeBadge =
    creator.creator_size && SIZE_BADGE[creator.creator_size]
      ? SIZE_BADGE[creator.creator_size]
      : 'border border-slate-400/35 bg-slate-500/15 text-slate-200'

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-creators sponsor-creators-detail mx-auto max-w-5xl space-y-6">
          <Link
            href="/sponsor/creators"
            className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
          >
            <span aria-hidden>&larr;</span>
            {t('back')}
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    creator.is_available
                      ? 'border border-[#22c55e]/40 bg-[#22c55e]/15 text-[#86efac]'
                      : 'border border-slate-400/40 bg-slate-500/20 text-slate-200'
                  }`}
                >
                  {creator.is_available ? t('available') : t('unavailable')}
                </span>
                {creator.creator_size && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${sizeBadge}`}
                  >
                    {creator.creator_size}
                  </span>
                )}
              </div>
              <p className="cr-field-label">{t('creatorLabel')}</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                {displayName}
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                {creator.location ?? t('locationNotSet')}
              </p>
            </div>
            <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
              <p className="font-headline text-2xl font-semibold tabular-nums text-[#99f7ff]">
                {formatNum(totalFollowers)}
              </p>
              <p className="sp-app-stat-label mt-0.5">{t('totalFollowers')}</p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <NxHudCard
                as="section"
                className="dash-panel dash-panel--nx-top border border-white/16 border-t-2 border-t-[#bffcff] p-5 sm:p-6"
              >
                <h2 className="cr-panel-title">{t('creatorProfile')}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t('platforms')}
                    value={
                      creator.platform.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {creator.platform.map(p => (
                            <Tag key={p}>{p}</Tag>
                          ))}
                        </div>
                      ) : (
                        <span className="cr-text-muted">—</span>
                      )
                    }
                  />
                  <Field
                    label={t('creatorTypes')}
                    value={
                      creator.creator_types.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {creator.creator_types.map(type => (
                            <Tag key={type}>{type}</Tag>
                          ))}
                        </div>
                      ) : (
                        <span className="cr-text-muted">—</span>
                      )
                    }
                  />
                  <Field
                    label={t('gameCategories')}
                    value={
                      creator.game_category.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {creator.game_category.map(g => (
                            <span
                              key={g}
                              className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="cr-text-muted">—</span>
                      )
                    }
                  />
                  <Field
                    label={t('contentTypes')}
                    value={
                      creator.content_type.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {creator.content_type.map(ct => (
                            <span
                              key={ct}
                              className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]"
                            >
                              {ct}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="cr-text-muted">—</span>
                      )
                    }
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label={t('steam')}
                      value={
                        creator.steam_id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded border border-[#66c0f4]/35 bg-[#66c0f4]/10 px-2 py-0.5 text-xs text-[#bcdcf2]">
                              <svg width="11" height="11" viewBox="0 0 32 32" fill="#66c0f4" aria-hidden>
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M16 0C7.5 0 0.6 6.6 0 14.9l8.6 3.6c0.7-0.5 1.6-0.8 2.6-0.8 0.1 0 0.2 0 0.3 0l3.8-5.5c0-2.6 2.1-4.7 4.7-4.7 2.6 0 4.7 2.1 4.7 4.7 0 2.6-2.1 4.7-4.7 4.7-0.1 0-0.1 0-0.2 0l-5.4 3.9c0 0.1 0 0.2 0 0.3 0 2.5-2 4.5-4.5 4.5-2.2 0-4-1.5-4.4-3.6L0.4 19.5C2.3 26.6 8.5 32 16 32c8.8 0 16-7.2 16-16C32 7.2 24.8 0 16 0zM10 24.3l-1.9-0.8c0.3 0.7 0.9 1.3 1.7 1.6 1.7 0.7 3.6-0.1 4.3-1.8 0.3-0.8 0.3-1.7 0-2.5-0.3-0.8-1-1.4-1.7-1.7-0.8-0.3-1.6-0.3-2.3 0l2 0.8c1.2 0.5 1.8 1.9 1.3 3.1S11.2 24.8 10 24.3zM23.1 14.9c1.7 0 3.1-1.4 3.1-3.1 0-1.7-1.4-3.1-3.1-3.1-1.7 0-3.1 1.4-3.1 3.1C20 13.5 21.4 14.9 23.1 14.9zM23.1 9.4c1.3 0 2.4 1.1 2.4 2.4 0 1.3-1.1 2.4-2.4 2.4-1.3 0-2.4-1.1-2.4-2.4C20.7 10.5 21.8 9.4 23.1 9.4z"
                                />
                              </svg>
                              {creator.steam_username ?? t('steamConnected')}
                            </span>
                            <span className="font-mono text-nx-11 cr-stat-caption">{creator.steam_id}</span>
                          </div>
                        ) : (
                          <span className="cr-text-muted">{t('notConnected')}</span>
                        )
                      }
                    />
                  </div>
                </div>
              </NxHudCard>
            </div>

            <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
              <NxHudCard as="div" className="sp-app-stat-panel rounded-xl p-4">
                <h3 className="cr-panel-title">{t('performance')}</h3>
                <dl className="mt-3 space-y-2.5">
                  <SideRow label={t('twitchFollowers')}>{formatNum(creator.subs_followers)}</SideRow>
                  <SideRow label={t('youtubeSubscribers')}>{formatNum(creator.youtube_subscribers)}</SideRow>
                  <SideRow label={t('avgViews')}>{formatNum(avgViews)}</SideRow>
                  <SideRow label={t('engagement')}>
                    {creator.engagement_rate != null
                      ? `${Number(creator.engagement_rate).toFixed(1)}%`
                      : '—'}
                  </SideRow>
                </dl>
              </NxHudCard>

              <NxHudCard as="div" className="sp-app-stat-panel rounded-xl p-4">
                <h3 className="cr-panel-title">{t('audience')}</h3>
                <dl className="mt-3 space-y-3">
                  <SideRow label={t('ageRange')}>
                    {creator.audience_age_min != null && creator.audience_age_max != null
                      ? `${creator.audience_age_min}–${creator.audience_age_max}`
                      : '—'}
                  </SideRow>
                  <div>
                    <p className="sp-app-stat-label mb-1.5">{t('locations')}</p>
                    <div className="flex flex-wrap gap-1">
                      {creator.audience_locations.length > 0 ? (
                        creator.audience_locations.map(loc => (
                          <Tag key={loc} className="cr-text-muted">
                            {loc}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-xs cr-text-muted">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="sp-app-stat-label mb-1.5">{t('interests')}</p>
                    <div className="flex flex-wrap gap-1">
                      {creator.audience_interests.length > 0 ? (
                        creator.audience_interests.slice(0, 8).map(interest => (
                          <Tag key={interest} className="cr-text-muted">
                            {interest}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-xs cr-text-muted">—</span>
                      )}
                    </div>
                  </div>
                </dl>
              </NxHudCard>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
