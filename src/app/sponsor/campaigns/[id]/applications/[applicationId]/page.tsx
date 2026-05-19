import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../../_components/dashboard/SponsorHeader'
import ApplicationDecisionButtons from '@/components/sponsor/ApplicationDecisionButtons'
import { TIER_LABELS } from '@/lib/reputation'
import type { ReputationTier } from '@/lib/reputation'
import { getRankName } from '@/lib/creator-xp'

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

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="sp-app-stat-label">{label}</p>
      <p className="sp-app-stat-value mt-0.5">
        {value ?? <span className="font-normal cr-text-muted italic">Not specified</span>}
      </p>
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
          ? `Up to ${audienceAgeMax}`
          : null

  const displayName =
    creator.twitch_username ?? creator.youtube_handle ?? creator.email ?? 'Creator'
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
            ← Back to applications
          </BackLink>

          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">Campaign</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                {campaign.title}
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                Applicant {index + 1} of {total}
              </p>
            </div>
            <nav className="flex shrink-0 items-center gap-2 text-sm">
              {prev ? (
                <Link
                  href={`/sponsor/campaigns/${campaignId}/applications/${prev.id}`}
                  className="font-medium text-[#99f7ff] transition-colors hover:text-[#bffcff]"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="cr-text-muted opacity-50">← Previous</span>
              )}
              <span className="cr-text-muted opacity-40">|</span>
              {next ? (
                <Link
                  href={`/sponsor/campaigns/${campaignId}/applications/${next.id}`}
                  className="font-medium text-[#99f7ff] transition-colors hover:text-[#bffcff]"
                >
                  Next →
                </Link>
              ) : (
                <span className="cr-text-muted opacity-50">Next →</span>
              )}
            </nav>
          </div>

          <article
            className={`dash-panel dash-panel--nx-top space-y-5 rounded-xl border border-white/16 border-l-4 bg-black/20 p-4 sm:p-6 ${status.border}`}
          >
            <header className="border-b border-white/10 pb-4">
              <p className="cr-meta-label mb-0.5">Creator</p>
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
                  {status.label}
                </span>
                {current.submitted_at && (
                  <span className="text-xs cr-stat-caption">
                    Submitted{' '}
                    {new Date(current.submitted_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                )}
                <span className="rounded-full border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2.5 py-1 text-xs font-medium text-[#99f7ff]">
                  Lv. {creatorLevel} · {creatorRankName}
                </span>
                {creator.reputation_tier && (
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tierBadge}`}>
                    {TIER_LABELS[creator.reputation_tier as ReputationTier] ?? creator.reputation_tier}
                  </span>
                )}
              </div>
            </header>

            {current.message && (
              <div className="sp-app-note-panel rounded-lg p-3 sm:p-4">
                <p className="cr-field-label mb-1.5">Why they think they&apos;re a great fit</p>
                <p className="text-sm leading-relaxed cr-text">{current.message}</p>
              </div>
            )}

            <DataSection title="Audience">
              <StatCell label="Age range" value={ageRangeStr} />
              <StatCell
                label="Audience locations"
                value={audienceLocations?.length ? audienceLocations.join(' · ') : null}
              />
              <StatCell label="Creator location" value={displayLocation} />
              <StatCell
                label="Languages"
                value={creator.language?.length ? creator.language.join(' · ') : null}
              />
            </DataSection>

            <DataSection title="General">
              <StatCell
                label="Platforms"
                value={creator.platform?.length ? creator.platform.join(' · ') : null}
              />
              <StatCell
                label="Content type"
                value={creator.content_type?.length ? creator.content_type.join(' · ') : null}
              />
              <StatCell
                label="Game / categories"
                value={creator.game_category?.length ? creator.game_category.join(' · ') : null}
              />
              <StatCell
                label="Followers / subs"
                value={creator.subs_followers != null ? creator.subs_followers.toLocaleString() : null}
              />
            </DataSection>

            {creator.twitch_username && (
              <DataSection title="Twitch" titleClassName="text-[#b89aff]">
                <StatCell label="Username" value={`@${creator.twitch_username}`} />
                <StatCell
                  label="Broadcaster type"
                  value={
                    creator.twitch_broadcaster_type
                      ? creator.twitch_broadcaster_type.charAt(0).toUpperCase() +
                        creator.twitch_broadcaster_type.slice(1)
                      : null
                  }
                />
                <StatCell
                  label="Followers"
                  value={creator.subs_followers != null ? creator.subs_followers.toLocaleString() : null}
                />
                <StatCell
                  label="Paid subscribers"
                  value={
                    creator.twitch_subscriber_count != null
                      ? creator.twitch_subscriber_count.toLocaleString()
                      : null
                  }
                />
                <StatCell
                  label="Avg VOD views"
                  value={
                    creator.average_vod_views != null
                      ? creator.average_vod_views.toLocaleString()
                      : null
                  }
                />
                {creator.twitch_synced_at && (
                  <StatCell
                    label="Data last synced"
                    value={new Date(creator.twitch_synced_at).toLocaleDateString()}
                  />
                )}
              </DataSection>
            )}

            {creator.youtube_channel_id && (
              <DataSection title="YouTube" titleClassName="text-[#f08080]">
                <StatCell
                  label="Channel"
                  value={creator.youtube_channel_name ?? creator.youtube_handle ?? null}
                />
                {creator.youtube_handle && (
                  <StatCell label="Handle" value={`@${creator.youtube_handle}`} />
                )}
                <StatCell
                  label="Subscribers"
                  value={
                    creator.youtube_subscribers != null
                      ? creator.youtube_subscribers.toLocaleString()
                      : null
                  }
                />
                <StatCell
                  label="Channel members"
                  value={
                    creator.youtube_member_count != null
                      ? creator.youtube_member_count.toLocaleString()
                      : null
                  }
                />
                <StatCell
                  label="Avg views per video"
                  value={
                    creator.youtube_avg_views != null
                      ? creator.youtube_avg_views.toLocaleString()
                      : null
                  }
                />
                <StatCell
                  label="Watch time (30-day hrs)"
                  value={
                    creator.youtube_watch_time_hours != null
                      ? creator.youtube_watch_time_hours.toLocaleString()
                      : null
                  }
                />
                {creator.youtube_top_categories?.length ? (
                  <StatCell
                    label="Top categories"
                    value={creator.youtube_top_categories.join(' · ')}
                  />
                ) : null}
                {creator.youtube_synced_at && (
                  <StatCell
                    label="Data last synced"
                    value={new Date(creator.youtube_synced_at).toLocaleDateString()}
                  />
                )}
              </DataSection>
            )}

            <footer className="border-t border-white/10 pt-5">
              <p className="cr-field-label mb-3">Decision</p>
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
