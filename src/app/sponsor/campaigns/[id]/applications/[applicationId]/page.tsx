import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../../SponsorHeader'
import ApplicationDecisionButtons from '@/components/sponsor/ApplicationDecisionButtons'

type Props = {
  params: Promise<{ id?: string; applicationId?: string }>
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="uppercase tracking-wide text-[10px] mb-1 dash-text-muted">{label}</p>
      <p className="text-sm dash-text-bright">{value ?? <span className="dash-text-muted italic">Not specified</span>}</p>
    </div>
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

  // Resolve audience data: prefer application-specific override, fall back to profile
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

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <BackLink href={`/sponsor/campaigns/${campaignId}/applications`} className="mb-4 inline-block">
            ← Back to applications
          </BackLink>

          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold dash-text-bright mb-1">{campaign.title}</h1>
              <p className="dash-text-muted text-sm">Applicant {index + 1}/{total}</p>
            </div>
            <div className="flex items-center gap-2 text-sm dash-text-muted">
              {prev ? (
                <Link href={`/sponsor/campaigns/${campaignId}/applications/${prev.id}`} className="dash-accent hover:underline">
                  ← Previous
                </Link>
              ) : (
                <span className="opacity-40">← Previous</span>
              )}
              <span className="mx-1">|</span>
              {next ? (
                <Link href={`/sponsor/campaigns/${campaignId}/applications/${next.id}`} className="dash-accent hover:underline">
                  Next →
                </Link>
              ) : (
                <span className="opacity-40">Next →</span>
              )}
            </div>
          </div>

          <div className="dash-panel p-5 space-y-5">
            {/* Creator identity */}
            <div>
              <p className="font-semibold dash-text-bright text-base">
                {creator.twitch_username ?? creator.youtube_handle ?? creator.email}
              </p>
              {creator.email && (
                <p className="text-xs dash-text-muted mt-0.5">{creator.email}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    current.status === 'pending'
                      ? 'bg-[#eab308]/20 text-[#eab308]'
                      : current.status === 'accepted'
                        ? 'bg-[#22c55e]/20 text-[#22c55e]'
                        : current.status === 'invited'
                          ? 'bg-[#00c8ff]/20 text-[#00c8ff]'
                          : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                  }`}
                >
                  {current.status === 'invited' ? 'Invited (pending)' : current.status}
                </span>
                {current.submitted_at && (
                  <span className="text-xs dash-text-muted">
                    {new Date(current.submitted_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Application pitch */}
            {current.message && (
              <div className="border-t dash-border pt-4">
                <p className="uppercase tracking-wide text-[10px] mb-2 dash-text-muted">Why they think they're a great fit</p>
                <p className="text-sm dash-text leading-relaxed">{current.message}</p>
              </div>
            )}

            {/* Audience info */}
            <div className="border-t dash-border pt-4">
              <p className="uppercase tracking-wide text-[10px] mb-3 dash-text-muted">Audience</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatCell label="Age Range" value={ageRangeStr} />
                <StatCell
                  label="Audience Locations"
                  value={audienceLocations?.length ? audienceLocations.join(' · ') : null}
                />
                <StatCell label="Creator Location" value={displayLocation} />
                <StatCell
                  label="Languages"
                  value={creator.language?.length ? creator.language.join(' · ') : null}
                />
              </div>
            </div>

            {/* General stats */}
            <div className="border-t dash-border pt-4">
              <p className="uppercase tracking-wide text-[10px] mb-3 dash-text-muted">General</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatCell
                  label="Platforms"
                  value={creator.platform?.length ? creator.platform.join(' · ') : null}
                />
                <StatCell
                  label="Content Type"
                  value={creator.content_type?.length ? creator.content_type.join(' · ') : null}
                />
                <StatCell
                  label="Game / Categories"
                  value={creator.game_category?.length ? creator.game_category.join(' · ') : null}
                />
                <StatCell
                  label="Followers / Subs"
                  value={creator.subs_followers != null ? creator.subs_followers.toLocaleString() : null}
                />
              </div>
            </div>

            {/* Twitch stats */}
            {creator.twitch_username && (
              <div className="border-t dash-border pt-4">
                <p className="uppercase tracking-wide text-[10px] mb-3 text-[#9b6fff]">Twitch</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StatCell label="Username" value={`@${creator.twitch_username}`} />
                  <StatCell
                    label="Broadcaster Type"
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
                    label="Paid Subscribers"
                    value={
                      creator.twitch_subscriber_count != null
                        ? creator.twitch_subscriber_count.toLocaleString()
                        : null
                    }
                  />
                  <StatCell
                    label="Avg VOD Views"
                    value={
                      creator.average_vod_views != null
                        ? creator.average_vod_views.toLocaleString()
                        : null
                    }
                  />
                  {creator.twitch_synced_at && (
                    <StatCell
                      label="Data Last Synced"
                      value={new Date(creator.twitch_synced_at).toLocaleDateString()}
                    />
                  )}
                </div>
              </div>
            )}

            {/* YouTube stats */}
            {creator.youtube_channel_id && (
              <div className="border-t dash-border pt-4">
                <p className="uppercase tracking-wide text-[10px] mb-3 text-[#ff5555]">YouTube</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    label="Channel Members"
                    value={
                      creator.youtube_member_count != null
                        ? creator.youtube_member_count.toLocaleString()
                        : null
                    }
                  />
                  <StatCell
                    label="Avg Views per Video"
                    value={
                      creator.youtube_avg_views != null
                        ? creator.youtube_avg_views.toLocaleString()
                        : null
                    }
                  />
                  <StatCell
                    label="Watch Time (30-day hrs)"
                    value={
                      creator.youtube_watch_time_hours != null
                        ? creator.youtube_watch_time_hours.toLocaleString()
                        : null
                    }
                  />
                  {creator.youtube_top_categories?.length ? (
                    <StatCell
                      label="Top Categories"
                      value={creator.youtube_top_categories.join(' · ')}
                    />
                  ) : null}
                  {creator.youtube_synced_at && (
                    <StatCell
                      label="Data Last Synced"
                      value={new Date(creator.youtube_synced_at).toLocaleDateString()}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Accept / Reject */}
            <div className="border-t dash-border pt-4">
              <ApplicationDecisionButtons
                applicationId={current.id}
                campaignId={campaignId}
                currentStatus={current.status}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
