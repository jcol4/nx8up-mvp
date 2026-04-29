import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getSponsorDealRooms } from './_actions'

const SUBMISSION_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Awaiting submission',
    className: 'border border-white/10 bg-white/10 text-[#a9abb5]',
  },
  submitted: {
    label: 'Under review',
    className: 'border border-white/10 bg-white/10 text-[#a9abb5]',
  },
  admin_rejected: {
    label: 'Under review',
    className: 'border border-white/10 bg-white/10 text-[#a9abb5]',
  },
  admin_verified: {
    label: 'Needs your review',
    className: 'border border-yellow-500/25 bg-yellow-500/15 text-yellow-300',
  },
  approved: {
    label: 'Approved',
    className: 'border border-green-500/30 bg-green-500/15 text-green-300',
  },
  revision_requested: {
    label: 'Revision requested',
    className: 'border border-orange-500/30 bg-orange-500/15 text-orange-300',
  },
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
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Deals</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Deal Room</h1>
            <p className="mt-1 text-sm text-[#a9abb5]">
              Review content submissions from your accepted creators.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl p-8 text-center text-[#a9abb5]">
              <p className="mb-2 text-[#e8f4ff]">No active deals yet.</p>
              <p className="text-xs leading-relaxed">
                Once you launch a campaign with accepted creators, their deal rooms will appear here.
              </p>
              <Link
                href="/sponsor/campaigns"
                className="mt-4 inline-block text-sm font-medium text-[#99f7ff] underline-offset-2 hover:underline"
              >
                View campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(grouped).map(({ campaignTitle, campaignId, items }) => (
                <div key={campaignId} className="dash-panel dash-panel--nx-top rounded-xl p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="font-headline text-base font-semibold text-[#e8f4ff]">{campaignTitle}</h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[#a9abb5]">
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
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/[0.04]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#e8f4ff]">{handle}</p>
                            <p className="mt-0.5 text-xs text-[#a9abb5]">
                              {app.creator.platform.join(', ')}
                              {app.campaign.end_date
                                ? ` · Deadline: ${new Date(app.campaign.end_date).toLocaleDateString()}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`rounded-md px-2 py-0.5 text-xs ${subStatus.className}`}>
                              {subStatus.label}
                            </span>
                            <span className="text-xs font-medium text-[#99f7ff]">Review →</span>
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
