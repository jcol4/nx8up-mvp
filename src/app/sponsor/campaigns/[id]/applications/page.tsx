import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../_components/dashboard/SponsorHeader'

const STATUS_STYLES: Record<string, { badge: string; border: string; label: string }> = {
  pending: {
    badge: 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/35',
    border: 'border-l-[#eab308]/70',
    label: 'Pending review',
  },
  accepted: {
    badge: 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/35',
    border: 'border-l-[#22c55e]/70',
    label: 'Accepted',
  },
  invited: {
    badge: 'bg-[#99f7ff]/12 text-[#99f7ff] border border-[#99f7ff]/35',
    border: 'border-l-[#99f7ff]/60',
    label: 'Invited — awaiting response',
  },
  rejected: {
    badge: 'bg-white/10 text-[#c8d4e4] border border-white/15',
    border: 'border-l-white/25',
    label: 'Declined',
  },
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

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-applications sponsor-applications-detail mx-auto max-w-4xl space-y-6">
          <BackLink
            href="/sponsor/campaigns"
            className="mb-1 inline-block text-sm text-[#99f7ff] transition-colors hover:text-[#bffcff]"
          >
            ← Back to campaigns
          </BackLink>

          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">Campaign</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                {campaign.title}
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                Review creators who applied to this campaign.
              </p>
            </div>
            <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
              <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                {applicantCount}
              </p>
              <p className="sp-app-stat-label mt-0.5">
                {applicantCount === 1 ? 'Applicant' : 'Applicants'}
              </p>
            </div>
          </div>

          {applicantCount === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
              <p className="text-sm font-medium text-[#e8f4ff]">No applications yet</p>
              <p className="mt-1 text-sm cr-text-muted">
                When creators apply, they will show up here for you to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="cr-field-label px-1">Applicant list</p>
              {campaign.applications.map((app) => {
                const displayName =
                  app.creator.twitch_username ??
                  app.creator.youtube_handle ??
                  app.creator.email ??
                  'Creator'
                const statusKey = app.status in STATUS_STYLES ? app.status : 'rejected'
                const status = STATUS_STYLES[statusKey]

                const stats: { label: string; value: string }[] = []
                if (app.creator.subs_followers != null) {
                  stats.push({
                    label: 'Followers',
                    value: app.creator.subs_followers.toLocaleString(),
                  })
                }
                if (app.creator.average_vod_views != null) {
                  stats.push({
                    label: 'Avg VOD views',
                    value: app.creator.average_vod_views.toLocaleString(),
                  })
                }
                if (app.creator.youtube_subscribers != null) {
                  stats.push({
                    label: 'YouTube subs',
                    value: app.creator.youtube_subscribers.toLocaleString(),
                  })
                }
                if (app.creator.platform?.length) {
                  stats.push({
                    label: 'Platforms',
                    value: app.creator.platform.join(', '),
                  })
                }
                if (app.tracking_short_code) {
                  stats.push({
                    label: 'Link clicks',
                    value: app._count.link_clicks.toLocaleString(),
                  })
                }

                return (
                  <article
                    key={app.id}
                    className={`dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-l-4 bg-black/20 p-4 sm:p-5 ${status.border}`}
                  >
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="min-w-0">
                        <p className="cr-meta-label mb-0.5">Creator</p>
                        <h2 className="font-headline text-lg font-semibold text-[#e8f4ff]">{displayName}</h2>
                        {app.creator.email && (
                          <p className="mt-0.5 text-sm cr-text-muted">{app.creator.email}</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${status.badge}`}
                        >
                          {status.label}
                        </span>
                        {app.submitted_at && (
                          <p className="mt-1.5 text-xs cr-stat-caption">
                            Submitted{' '}
                            {new Date(app.submitted_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        )}
                      </div>
                    </header>

                    {stats.length > 0 && (
                      <div className="sp-app-stat-panel mt-4 rounded-lg p-3 sm:p-4">
                        <p className="cr-field-label mb-3">Creator reach</p>
                        <dl className="flex flex-wrap gap-x-6 gap-y-3">
                          {stats.map((s) => (
                            <StatCell key={s.label} label={s.label} value={s.value} />
                          ))}
                        </dl>
                      </div>
                    )}

                    {app.message && (
                      <div className="sp-app-note-panel mt-4 rounded-lg p-3 sm:p-4">
                        <p className="cr-field-label mb-1.5">Why they applied</p>
                        <p className="text-sm leading-relaxed cr-text">{app.message}</p>
                      </div>
                    )}

                    <footer className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4">
                      <Link
                        href={`/sponsor/campaigns/${campaign.id}/applications/${app.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-4 py-2 text-sm font-semibold text-[#bffcff] transition-colors hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
                      >
                        Review full application →
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
