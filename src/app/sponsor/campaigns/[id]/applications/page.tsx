import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BackLink } from '@/components/shared'
import SponsorHeader from '../../../SponsorHeader'

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

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <BackLink href="/sponsor/campaigns" className="mb-4 inline-block">
            ← Back to campaigns
          </BackLink>
          <h1 className="text-xl font-semibold dash-text-bright mb-1">{campaign.title}</h1>
          <p className="dash-text-muted text-sm mb-6">Applications</p>

          {campaign.applications.length === 0 ? (
            <div className="dash-panel p-8 text-center dash-text-muted">
              No applications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {campaign.applications.map((app) => (
                <div
                  key={app.id}
                  className="dash-panel p-4 flex flex-wrap gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium dash-text-bright">
                      {app.creator.twitch_username ?? app.creator.youtube_handle ?? app.creator.email}
                    </p>
                    {app.creator.email && (
                      <p className="text-xs dash-text-muted mt-0.5">{app.creator.email}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          app.status === 'pending'
                            ? 'bg-[#eab308]/20 text-[#eab308]'
                            : app.status === 'accepted'
                              ? 'bg-[#22c55e]/20 text-[#22c55e]'
                              : app.status === 'invited'
                                ? 'bg-[#00c8ff]/20 text-[#00c8ff]'
                                : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                        }`}
                      >
                        {app.status === 'invited' ? 'Invited (pending)' : app.status}
                      </span>
                      {app.submitted_at && (
                        <span className="text-xs dash-text-muted">
                          {new Date(app.submitted_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      )}
                    </div>
                    {/* Quick stats row */}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs dash-text-muted">
                      {app.creator.subs_followers != null && (
                        <span>{app.creator.subs_followers.toLocaleString()} followers</span>
                      )}
                      {app.creator.average_vod_views != null && (
                        <span>{app.creator.average_vod_views.toLocaleString()} avg VOD views</span>
                      )}
                      {app.creator.youtube_subscribers != null && (
                        <span>{app.creator.youtube_subscribers.toLocaleString()} YT subs</span>
                      )}
                      {app.creator.platform?.length ? (
                        <span>{app.creator.platform.join(' · ')}</span>
                      ) : null}
                      {app.tracking_short_code && (
                        <span className="text-[#00c8ff]">
                          {app._count.link_clicks.toLocaleString()} link click{app._count.link_clicks !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {app.message && (
                      <p className="text-sm dash-text-muted mt-2 border-t dash-border pt-2 line-clamp-2">
                        {app.message}
                      </p>
                    )}
                  </div>
                  <div className="w-full mt-2 text-right text-xs dash-accent">
                    <Link href={`/sponsor/campaigns/${campaign.id}/applications/${app.id}`} className="hover:underline">
                      Review applicant →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
