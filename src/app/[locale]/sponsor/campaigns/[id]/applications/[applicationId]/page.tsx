import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../../_components/dashboard/SponsorHeader'
import ApplicationDecisionButtons from '@/components/sponsor/ApplicationDecisionButtons'
import { getRankName } from '@/lib/creator-xp'

const STATUS_STYLES: Record<string, { badge: string; border: string }> = {
  pending: {
    badge: 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/35',
    border: 'border-l-[#eab308]/70',
  },
  accepted: {
    badge: 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/35',
    border: 'border-l-[#22c55e]/70',
  },
  invited: {
    badge: 'bg-[#99f7ff]/12 text-[#99f7ff] border border-[#99f7ff]/35',
    border: 'border-l-[#99f7ff]/60',
  },
  rejected: {
    badge: 'bg-white/10 text-[#c8d4e4] border border-white/15',
    border: 'border-l-white/25',
  },
}

const STATUS_KEY: Record<string, string> = {
  pending: 'statusPending',
  accepted: 'statusAccepted',
  invited: 'statusInvited',
  rejected: 'statusRejected',
}

const TIER_BADGE: Record<string, string> = {
  verified: 'bg-[#22c55e]/15 border-[#22c55e]/30 text-[#4ade80]',
  trusted: 'bg-[#99f7ff]/12 border-[#99f7ff]/30 text-[#99f7ff]',
  restricted: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  sanctioned: 'bg-red-500/15 border-red-500/30 text-red-400',
  neutral: 'bg-white/10 border-white/20 text-[#c8d4e4]',
}

type Props = {
  params: Promise<{ id?: string; applicationId?: string }>
}

function StatCell({ label, value, empty }: { label: string; value: React.ReactNode; empty: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="sp-app-stat-label">{label}</p>
      <p className="sp-app-stat-value mt-0.5">{value ?? empty}</p>
    </div>
  )
}

function DataSection({
  title,
  titleClassName,
  children,
}: {
  title: string
  titleClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className="sp-app-stat-panel rounded-lg p-3 sm:p-4">
      <p className={`cr-field-label mb-3 ${titleClassName ?? ''}`}>{title}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export default async function ApplicationReviewPage({ params }: Props) {
  const { id: campaignId, applicationId } = await params

  if (!campaignId || !applicationId) notFound()

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const t = await getTranslations('sponsor.applications')
  const tEnum = await getTranslations('enums')
  const format = await getFormatter()
  const empty = <span className="font-normal cr-text-muted italic">{t('notSpecified')}</span>

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) redirect('/')

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    include: {
      applications: {
        include: { creator: true },
        orderBy: { submitted_at: 'desc' },
      },
    },
  })

  if (!campaign || campaign.sponsor_id !== sponsor.id) notFound()

  const applications = campaign.applications
  const index = applications.findIndex((a) => a.id === applicationId)
  if (index === -1) notFound()

  const total = applications.length
  const current = applications[index]
  const prev = index > 0 ? applications[index - 1] : null
  const next = index < total - 1 ? applications[index + 1] : null
  const creator = current.creator

  const clerkUser = await (await clerkClient()).users.getUser(creator.clerk_user_id).catch(() => null)
  const creatorMeta = (clerkUser?.publicMetadata || {}) as Record<string, unknown>
  const creatorLevel = Math.max(1, Number(creatorMeta.creatorLevel) || 1)
  const creatorRankName = getRankName(creatorLevel)

  const audienceAgeMin = current.app_audience_age_min ?? creator.audience_age_min
  const audienceAgeMax = current.app_audience_age_max ?? creator.audience_age_max
  const audienceLocations =
    current.app_audience_locations?.length
      ? current.app_audience_locations
      : creator.audience_locations

  const displayLocation = current.app_location || creator.location

  const ageRangeStr =
    audienceAgeMin != null && audienceAgeMax != null
      ? `${audienceAgeMin}–${audienceAgeMax}`
      : audienceAgeMin != null
        ? `${audienceAgeMin}+`
        : audienceAgeMax != null
          ? t('upTo', { max: audienceAgeMax })
          : null

  const displayName =
    creator.twitch_username ?? creator.youtube_handle ?? creator.email ?? t('creatorFallback')
  const statusKey = current.status in STATUS_STYLES ? current.status : 'rejected'
  const status = STATUS_STYLES[statusKey]
  const tierKey = creator.reputation_tier ?? 'neutral'
  const tierBadge = TIER_BADGE[tierKey] ?? TIER_BADGE.neutral

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-applications sponsor-applications-detail mx-auto max-w-3xl space-y-6">
          <BackLink
            href={`/sponsor/campaigns/${campaignId}/applications`}
            className="inline-block text-sm text-[#99f7ff] transition-colors hover:text-[#bffcff]"
          >
            {t('backToApps')}
          </BackLink>

          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">{t('campaignLabel')}</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                {campaign.title}
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                {t('applicantOf', { n: index + 1, total })}
              </p>
            </div>
            <nav className="flex shrink-0 items-center gap-2 text-sm">
              {prev ? (
                <Link
                  href={`/sponsor/campaigns/${campaignId}/applications/${prev.id}`}
                  className="font-medium text-[#99f7ff] transition-colors hover:text-[#bffcff]"
                >
                  {t('prev')}
                </Link>
              ) : (
                <span className="cr-text-muted opacity-50">{t('prev')}</span>
              )}
              <span className="cr-text-muted opacity-40">|</span>
              {next ? (
                <Link
                  href={`/sponsor/campaigns/${campaignId}/applications/${next.id}`}
                  className="font-medium text-[#99f7ff] transition-colors hover:text-[#bffcff]"
                >
                  {t('next')}
                </Link>
              ) : (
                <span className="cr-text-muted opacity-50">{t('next')}</span>
              )}
            </nav>
          </div>

          <article
            className={`dash-panel dash-panel--nx-top space-y-5 rounded-xl border border-white/16 border-l-4 bg-black/20 p-4 sm:p-6 ${status.border}`}
          >
            <header className="border-b border-white/10 pb-4">
              <p className="cr-meta-label mb-0.5">{t('creatorLabel')}</p>
              <h2 className="font-headline text-lg font-semibold text-[#e8f4ff] sm:text-xl">
                {displayName}
              </h2>
              {creator.email && (
                <p className="mt-0.5 text-sm cr-text-muted">{creator.email}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${status.badge}`}
                >
                  {t(STATUS_KEY[statusKey])}
                </span>
                {current.submitted_at && (
                  <span className="text-xs cr-stat-caption">
                    {t('submitted', {
                      date: format.dateTime(new Date(current.submitted_at), 'dateTimeMedium'),
                    })}
                  </span>
                )}
                <span className="rounded-full border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2.5 py-1 text-xs font-medium text-[#99f7ff]">
                  Lv. {creatorLevel} · {creatorRankName}
                </span>
                {creator.reputation_tier && (
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tierBadge}`}>
                    {tEnum.has(`tier.${creator.reputation_tier}`) ? tEnum(`tier.${creator.reputation_tier}`) : creator.reputation_tier}
                  </span>
                )}
              </div>
            </header>

            {current.message && (
              <div className="sp-app-note-panel rounded-lg p-3 sm:p-4">
                <p className="cr-field-label mb-1.5">{t('whyGreatFit')}</p>
                <p className="text-sm leading-relaxed cr-text">{current.message}</p>
              </div>
            )}

            <DataSection title={t('sectionAudience')}>
              <StatCell empty={empty} label={t('ageRange')} value={ageRangeStr} />
              <StatCell empty={empty}
                label={t('audienceLocations')}
                value={audienceLocations?.length ? audienceLocations.join(' · ') : null}
              />
              <StatCell empty={empty} label={t('creatorLocation')} value={displayLocation} />
              <StatCell empty={empty}
                label={t('languages')}
                value={creator.language?.length ? creator.language.join(' · ') : null}
              />
            </DataSection>

            <DataSection title={t('sectionGeneral')}>
              <StatCell empty={empty}
                label={t('platforms')}
                value={creator.platform?.length ? creator.platform.join(' · ') : null}
              />
              <StatCell empty={empty}
                label={t('contentType')}
                value={creator.content_type?.length ? creator.content_type.join(' · ') : null}
              />
              <StatCell empty={empty}
                label={t('gameCategories')}
                value={creator.game_category?.length ? creator.game_category.join(' · ') : null}
              />
              <StatCell empty={empty}
                label={t('followersSubs')}
                value={creator.subs_followers != null ? format.number(creator.subs_followers) : null}
              />
            </DataSection>

            {creator.twitch_username && (
              <DataSection title={t('twitchTitle')} titleClassName="text-[#b89aff]">
                <StatCell empty={empty} label={t('username')} value={`@${creator.twitch_username}`} />
                <StatCell empty={empty}
                  label={t('broadcasterType')}
                  value={
                    creator.twitch_broadcaster_type
                      ? creator.twitch_broadcaster_type.charAt(0).toUpperCase() +
                        creator.twitch_broadcaster_type.slice(1)
                      : null
                  }
                />
                <StatCell empty={empty}
                  label={t('followers')}
                  value={creator.subs_followers != null ? format.number(creator.subs_followers) : null}
                />
                <StatCell empty={empty}
                  label={t('paidSubscribers')}
                  value={
                    creator.twitch_subscriber_count != null
                      ? format.number(creator.twitch_subscriber_count)
                      : null
                  }
                />
                <StatCell empty={empty}
                  label={t('avgVodViews')}
                  value={
                    creator.average_vod_views != null
                      ? format.number(creator.average_vod_views)
                      : null
                  }
                />
                {creator.twitch_synced_at && (
                  <StatCell empty={empty}
                    label={t('dataLastSynced')}
                    value={format.dateTime(new Date(creator.twitch_synced_at), 'numeric')}
                  />
                )}
              </DataSection>
            )}

            {creator.youtube_channel_id && (
              <DataSection title={t('youtubeTitle')} titleClassName="text-[#f08080]">
                <StatCell empty={empty}
                  label={t('channel')}
                  value={creator.youtube_channel_name ?? creator.youtube_handle ?? null}
                />
                {creator.youtube_handle && (
                  <StatCell empty={empty} label={t('handle')} value={`@${creator.youtube_handle}`} />
                )}
                <StatCell empty={empty}
                  label={t('subscribers')}
                  value={
                    creator.youtube_subscribers != null
                      ? format.number(creator.youtube_subscribers)
                      : null
                  }
                />
                <StatCell empty={empty}
                  label={t('channelMembers')}
                  value={
                    creator.youtube_member_count != null
                      ? format.number(creator.youtube_member_count)
                      : null
                  }
                />
                <StatCell empty={empty}
                  label={t('avgViewsPerVideo')}
                  value={
                    creator.youtube_avg_views != null
                      ? format.number(creator.youtube_avg_views)
                      : null
                  }
                />
                <StatCell empty={empty}
                  label={t('watchTime')}
                  value={
                    creator.youtube_watch_time_hours != null
                      ? format.number(creator.youtube_watch_time_hours)
                      : null
                  }
                />
                {creator.youtube_top_categories?.length ? (
                  <StatCell empty={empty}
                    label={t('topCategories')}
                    value={creator.youtube_top_categories.join(' · ')}
                  />
                ) : null}
                {creator.youtube_synced_at && (
                  <StatCell empty={empty}
                    label={t('dataLastSynced')}
                    value={format.dateTime(new Date(creator.youtube_synced_at), 'numeric')}
                  />
                )}
              </DataSection>
            )}

            <footer className="border-t border-white/10 pt-5">
              <p className="cr-field-label mb-3">{t('decision')}</p>
              <ApplicationDecisionButtons
                applicationId={current.id}
                campaignId={campaignId}
                currentStatus={current.status}
              />
            </footer>
          </article>
        </div>
      </div>
    </>
  )
}
