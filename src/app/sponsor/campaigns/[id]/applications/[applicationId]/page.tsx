import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../../SponsorHeader'
import ApplicationDecisionButtons from '@/components/sponsor/ApplicationDecisionButtons'

type Props = {
  params: { id?: string; applicationId?: string }
}

export default async function ApplicationReviewPage({ params }: Props) {
  const campaignId = params.id
  const applicationId = params.applicationId

  // Guard: if URL params are missing, 404
  if (!campaignId || !applicationId) {
    console.log('campaignId or applicationId is missing 1')
    console.log('campaignId', campaignId)
    console.log('applicationId', applicationId)
    notFound()
  }

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) redirect('/')

  // Load the campaign with all applications (including creator info)
  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    include: {
      applications: {
        include: { creator: true },
        orderBy: { submitted_at: 'desc' },
      },
    },
  })

  if (!campaign || campaign.sponsor_id !== sponsor.id) {
    notFound()
  }

  const applications = campaign.applications

  // Find the current application by id
  const index = applications.findIndex((a) => a.id === applicationId)
  if (index === -1) {
    notFound()
  }

  const total = applications.length
  const current = applications[index]
  const prev = index > 0 ? applications[index - 1] : null
  const next = index < total - 1 ? applications[index + 1] : null
  const creator = current.creator

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
              <p className="dash-text-muted text-sm">
                Applicant {index + 1}/{total}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm dash-text-muted">
              {prev ? (
                <Link
                  href={`/sponsor/campaigns/${campaignId}/applications/${prev.id}`}
                  className="dash-accent hover:underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="opacity-40">← Previous</span>
              )}
              <span className="mx-1">|</span>
              {next ? (
                <Link
                  href={`/sponsor/campaigns/${campaignId}/applications/${next.id}`}
                  className="dash-accent hover:underline"
                >
                  Next →
                </Link>
              ) : (
                <span className="opacity-40">Next →</span>
              )}
            </div>
          </div>

          <div className="dash-panel p-5 space-y-4">
            {/* Creator identity */}
            <div className="min-w-0 flex-1">
              <p className="font-medium dash-text-bright">
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
                        : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                  }`}
                >
                  {current.status}
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

            {/* Creator stats a sponsor cares about */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs dash-text-muted">
              <div>
                <p className="uppercase tracking-wide text-[10px] mb-1">Platforms</p>
                <p>{creator.platform?.length ? creator.platform.join(' · ') : 'Not specified'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] mb-1">Languages</p>
                <p>{creator.language?.length ? creator.language.join(' · ') : 'Not specified'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] mb-1">Followers</p>
                <p>{creator.subs_followers != null ? creator.subs_followers.toLocaleString() : 'Not specified'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] mb-1">Avg VOD Views</p>
                <p>{creator.average_vod_views != null ? creator.average_vod_views.toLocaleString() : 'Not specified'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] mb-1">Content Type</p>
                <p>{creator.content_type?.length ? creator.content_type.join(' · ') : 'Not specified'}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] mb-1">Game / Categories</p>
                <p>{creator.game_category?.length ? creator.game_category.join(' · ') : 'Not specified'}</p>
              </div>
            </div>

            {/* Application message */}
            {current.message && (
              <p className="text-sm dash-text-muted mt-2 border-t dash-border pt-3">
                {current.message}
              </p>
            )}

            {/* Accept / Reject */}
            <ApplicationDecisionButtons
              applicationId={current.id}
              campaignId={campaignId}
              currentStatus={current.status}
            />
          </div>
        </div>
      </div>
    </>
  )
}
