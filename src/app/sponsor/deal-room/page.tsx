import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getSponsorDealRooms } from './_actions'

const SUBMISSION_STATUS: Record<
  string,
  { label: string; badge: string; border: string; row: string; action: string }
> = {
  pending: {
    label: 'Awaiting submission',
    badge: 'bg-slate-500/20 text-slate-200 border border-slate-400/40',
    border: 'border-l-slate-400/80',
    row: 'bg-slate-500/8',
    action: 'View deal →',
  },
  submitted: {
    label: 'Under admin review',
    badge: 'bg-[#99f7ff]/15 text-[#bffcff] border border-[#99f7ff]/35',
    border: 'border-l-[#99f7ff]/70',
    row: 'bg-[#99f7ff]/5',
    action: 'View deal →',
  },
  admin_rejected: {
    label: 'Under admin review',
    badge: 'bg-[#99f7ff]/15 text-[#bffcff] border border-[#99f7ff]/35',
    border: 'border-l-[#99f7ff]/70',
    row: 'bg-[#99f7ff]/5',
    action: 'View deal →',
  },
  admin_verified: {
    label: 'Needs your review',
    badge: 'bg-[#eab308]/25 text-[#fde047] border border-[#eab308]/45',
    border: 'border-l-[#eab308]',
    row: 'bg-[#eab308]/10 ring-1 ring-inset ring-[#eab308]/25',
    action: 'Review now →',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-[#22c55e]/20 text-[#86efac] border border-[#22c55e]/40',
    border: 'border-l-[#22c55e]',
    row: 'bg-[#22c55e]/6',
    action: 'View deal →',
  },
  revision_requested: {
    label: 'Revision requested',
    badge: 'bg-orange-500/20 text-orange-200 border border-orange-400/40',
    border: 'border-l-orange-400',
    row: 'bg-orange-500/8',
    action: 'View deal →',
  },
}

const STATUS_LEGEND = [
  { label: 'Needs your review', swatch: 'bg-[#eab308]' },
  { label: 'Under admin review', swatch: 'bg-[#99f7ff]' },
  { label: 'Awaiting submission', swatch: 'bg-slate-400' },
  { label: 'Approved', swatch: 'bg-[#22c55e]' },
  { label: 'Revision sent', swatch: 'bg-orange-400' },
] as const

export default async function SponsorDealRoomPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const applications = await getSponsorDealRooms()

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

  const dealCount = applications.length

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-deal-room sponsor-deal-room-detail mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="cr-field-label">Deals</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                Deal Room
              </h1>
              <p className="mt-2 text-sm cr-text-muted">
                Review content submissions from your accepted creators.
              </p>
            </div>
            <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
              <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                {dealCount}
              </p>
              <p className="sp-app-stat-label mt-0.5">
                Active deal{dealCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {dealCount === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
              <p className="text-sm font-medium text-[#e8f4ff]">No active deals yet</p>
              <p className="mt-1 text-sm cr-text-muted">
                Once you launch a campaign with accepted creators, their deal rooms will appear here.
              </p>
              <Link
                href="/sponsor/campaigns"
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-4 py-2 text-sm font-semibold text-[#bffcff] transition-colors hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
              >
                View campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="sp-app-stat-label w-full sm:w-auto">Status key</span>
                {STATUS_LEGEND.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 text-xs cr-stat-caption">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${item.swatch}`} />
                    {item.label}
                  </span>
                ))}
              </div>
              <p className="cr-field-label px-1">By campaign</p>
              {Object.values(grouped).map(({ campaignTitle, campaignId, items }) => (
                <section
                  key={campaignId}
                  className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 sm:p-5"
                >
                  <header className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                    <h2 className="font-headline text-base font-semibold text-[#e8f4ff] sm:text-lg">
                      {campaignTitle}
                    </h2>
                    <span className="rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#bffcff]">
                      {items.length} creator{items.length !== 1 ? 's' : ''}
                    </span>
                  </header>
                  <div className="space-y-3">
                    {items.map((app) => {
                      const sub = app.deal_submission
                      const statusKey = sub?.status ?? 'pending'
                      const status =
                        SUBMISSION_STATUS[statusKey] ?? SUBMISSION_STATUS.pending
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
                          className={`flex items-center justify-between gap-3 rounded-lg border border-white/12 border-l-4 p-4 transition-colors hover:border-[#99f7ff]/35 ${status.border} ${status.row}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="cr-meta-label mb-0.5">Creator</p>
                            <p className="text-sm font-semibold text-[#e8f4ff]">{handle}</p>
                            <p className="mt-1 text-sm cr-stat-caption">
                              {app.creator.platform.join(', ')}
                              {app.campaign.end_date
                                ? ` · Deadline ${new Date(app.campaign.end_date).toLocaleDateString()}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}
                            >
                              {status.label}
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                statusKey === 'admin_verified'
                                  ? 'text-[#fde047]'
                                  : 'text-[#99f7ff]'
                              }`}
                            >
                              {status.action}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
