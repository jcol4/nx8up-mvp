import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../_components/dashboard/SponsorHeader'
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

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[7rem]">
      <dt className="sp-app-stat-label">{label}</dt>
      <dd className="sp-app-stat-value mt-0.5">{value}</dd>
    </div>
  )
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function CampaignApplicationsPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const t = await getTranslations('sponsor.applications')
  const tEnum = await getTranslations('enums')
  const format = await getFormatter()

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) redirect('/')

  const { id: campaignId } = await params

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    include: {
      applications: {
        include: {
          creator: true,
          _count: { select: { link_clicks: true } },
        },
        orderBy: { submitted_at: 'desc' },
      },
    },
  })

  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    notFound()
  }

  const applicantCount = campaign.applications.length

  // XP level lives in Clerk publicMetadata, not the DB — batch every applicant's
  // creator into one getUserList call so the list doesn't fan out to N requests.
  const clerkUserIds = [
    ...new Set(campaign.applications.map((a) => a.creator.clerk_user_id).filter(Boolean)),
  ]
  const creatorLevels: Record<string, number> = {}
  if (clerkUserIds.length) {
    try {
      const { data: users } = await (await clerkClient()).users.getUserList({
        userId: clerkUserIds,
        limit: clerkUserIds.length,
      })
      for (const u of users) {
        creatorLevels[u.id] = Math.max(1, Number((u.publicMetadata || {}).creatorLevel) || 1)
      }
    } catch {
      // Clerk unavailable — fall back to no level badge rather than failing the page.
    }
  }

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-applications sponsor-applications-detail mx-auto max-w-4xl space-y-6">
          <BackLink
            href="/sponsor/campaigns"
            className="mb-1 inline-block text-sm text-[#99f7ff] transition-colors hover:text-[#bffcff]"
          >
            {t('back')}
          </BackLink>

          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">{t('campaignLabel')}</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                {campaign.title}
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                {t('subtitle')}
              </p>
            </div>
            <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
              <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                {applicantCount}
              </p>
              <p className="sp-app-stat-label mt-0.5">
                {t('applicantLabel', { n: applicantCount })}
              </p>
            </div>
          </div>

          {applicantCount === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
              <p className="text-sm font-medium text-[#e8f4ff]">{t('emptyTitle')}</p>
              <p className="mt-1 text-sm cr-text-muted">
                {t('emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="cr-field-label px-1">{t('applicantList')}</p>
              {campaign.applications.map((app) => {
                const displayName =
                  app.creator.twitch_username ??
                  app.creator.youtube_handle ??
                  app.creator.email ??
                  t('creatorFallback')
                const statusKey = app.status in STATUS_STYLES ? app.status : 'rejected'
                const status = STATUS_STYLES[statusKey]
                const creatorLevel = creatorLevels[app.creator.clerk_user_id] ?? 1

                const stats: { label: string; value: string }[] = []
                if (app.creator.subs_followers != null) {
                  stats.push({
                    label: t('followers'),
                    value: format.number(app.creator.subs_followers),
                  })
                }
                if (app.creator.average_vod_views != null) {
                  stats.push({
                    label: t('avgVodViews'),
                    value: format.number(app.creator.average_vod_views),
                  })
                }
                if (app.creator.youtube_subscribers != null) {
                  stats.push({
                    label: t('ytSubs'),
                    value: format.number(app.creator.youtube_subscribers),
                  })
                }
                if (app.creator.platform?.length) {
                  stats.push({
                    label: t('platforms'),
                    value: app.creator.platform.join(', '),
                  })
                }
                if (app.tracking_short_code) {
                  stats.push({
                    label: t('linkClicks'),
                    value: format.number(app._count.link_clicks),
                  })
                }

                return (
                  <article
                    key={app.id}
                    className={`dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-l-4 bg-black/20 p-4 sm:p-5 ${status.border}`}
                  >
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="min-w-0">
                        <p className="cr-meta-label mb-0.5">{t('creatorLabel')}</p>
                        <h2 className="font-headline text-lg font-semibold text-[#e8f4ff]">{displayName}</h2>
                        {app.creator.email && (
                          <p className="mt-0.5 text-sm cr-text-muted">{app.creator.email}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2.5 py-1 text-xs font-medium text-[#99f7ff]">
                            Lv. {creatorLevel} · {getRankName(creatorLevel)}
                          </span>
                          {app.creator.reputation_tier && (
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${TIER_BADGE[app.creator.reputation_tier] ?? TIER_BADGE.neutral}`}
                            >
                              {tEnum.has(`tier.${app.creator.reputation_tier}`)
                                ? tEnum(`tier.${app.creator.reputation_tier}`)
                                : app.creator.reputation_tier}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${status.badge}`}
                        >
                          {t(STATUS_KEY[statusKey])}
                        </span>
                        {app.submitted_at && (
                          <p className="mt-1.5 text-xs cr-stat-caption">
                            {t('submitted', {
                              date: format.dateTime(new Date(app.submitted_at), 'dateTimeMedium'),
                            })}
                          </p>
                        )}
                      </div>
                    </header>

                    {stats.length > 0 && (
                      <div className="sp-app-stat-panel mt-4 rounded-lg p-3 sm:p-4">
                        <p className="cr-field-label mb-3">{t('creatorReach')}</p>
                        <dl className="flex flex-wrap gap-x-6 gap-y-3">
                          {stats.map((s) => (
                            <StatCell key={s.label} label={s.label} value={s.value} />
                          ))}
                        </dl>
                      </div>
                    )}

                    {app.message && (
                      <div className="sp-app-note-panel mt-4 rounded-lg p-3 sm:p-4">
                        <p className="cr-field-label mb-1.5">{t('whyApplied')}</p>
                        <p className="text-sm leading-relaxed cr-text">{app.message}</p>
                      </div>
                    )}

                    <footer className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
                      <Link
                        href={`/sponsor/campaigns/${campaign.id}/applications/${app.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-4 py-2 text-sm font-semibold text-[#bffcff] transition-colors hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
                      >
                        {t('reviewFull')}
                      </Link>
                    </footer>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
