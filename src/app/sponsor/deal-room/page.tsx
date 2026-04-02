import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import SponsorHeader from '../SponsorHeader'
import { getSponsorDealRooms } from './_actions'

const SUBMISSION_STATUS: Record<string, { label: string; className: string }> = {
  pending:            { label: 'Awaiting submission',  className: 'bg-[#94a3b8]/20 text-[#94a3b8]' },
  submitted:          { label: 'Under review',         className: 'bg-[#94a3b8]/20 text-[#94a3b8]' },
  admin_rejected:     { label: 'Under review',         className: 'bg-[#94a3b8]/20 text-[#94a3b8]' },
  admin_verified:     { label: 'Needs your review',    className: 'bg-yellow-500/20 text-yellow-400' },
  approved:           { label: 'Approved',             className: 'bg-green-500/20 text-green-400' },
  revision_requested: { label: 'Revision requested',   className: 'bg-orange-500/20 text-orange-400' },
}

export default async function SponsorDealRoomPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const applications = await getSponsorDealRooms()

  // Group by campaign
  const grouped = applications.reduce<
    Record<string, { campaignTitle: string; campaignId: string; items: typeof applications }>
  >((acc, app) => {
    const cid = app.campaign.id
    if (!acc[cid]) {
      acc[cid] = { campaignTitle: app.campaign.title ?? 'Untitled', campaignId: cid, items: [] }
    }
    acc[cid].items.push(app)
    return acc
  }, {})

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold dash-text-bright mb-1">Deal Room</h1>
            <p className="dash-text-muted text-sm">
              Review content submissions from your accepted creators.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="dash-panel p-8 text-center dash-text-muted">
              <p className="mb-2">No active deals yet.</p>
              <p className="text-xs">
                Once you launch a campaign with accepted creators, their deal rooms will appear here.
              </p>
              <Link href="/sponsor/campaigns" className="inline-block mt-4 text-sm dash-accent hover:underline">
                View campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(grouped).map(({ campaignTitle, campaignId, items }) => (
                <div key={campaignId}>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-sm font-semibold dash-text-bright">{campaignTitle}</h2>
                    <span className="text-xs dash-text-muted">
                      {items.length} creator{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((app) => {
                      const sub = app.deal_submission
                      const subStatus = SUBMISSION_STATUS[sub?.status ?? 'pending']
                      const handle =
                        app.creator.twitch_username
                          ? `@${app.creator.twitch_username} (Twitch)`
                          : app.creator.youtube_channel_name
                            ? `@${app.creator.youtube_channel_name} (YouTube)`
                            : 'Creator'
                      return (
                        <Link
                          key={app.id}
                          href={`/sponsor/deal-room/${app.id}`}
                          className="flex items-center justify-between gap-3 p-4 dash-panel hover:border-[rgba(0,200,255,0.25)] transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm dash-text-bright font-medium">{handle}</p>
                            <p className="text-xs dash-text-muted mt-0.5">
                              {app.creator.platform.join(', ')}
                              {app.campaign.end_date
                                ? ` · Deadline: ${new Date(app.campaign.end_date).toLocaleDateString()}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded ${subStatus.className}`}>
                              {subStatus.label}
                            </span>
                            <span className="text-xs dash-text-muted">Review →</span>
                          </div>
                        </Link>
                      )
                    })}
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
