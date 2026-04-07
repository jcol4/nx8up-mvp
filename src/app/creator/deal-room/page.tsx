import Link from 'next/link'
import { getMyDealRooms } from './_actions'
import { calcFeeBreakdown } from '@/lib/constants'

const SUBMISSION_STATUS: Record<string, { label: string; className: string }> = {
  pending:            { label: 'Not submitted',          className: 'bg-[#94a3b8]/20 text-[#94a3b8]' },
  submitted:          { label: 'Pending review',         className: 'bg-yellow-500/20 text-yellow-400' },
  admin_verified:     { label: 'Verified — awaiting sponsor', className: 'bg-[#00c8ff]/20 text-[#00c8ff]' },
  admin_rejected:     { label: 'Rejected — resubmit',   className: 'bg-red-500/20 text-red-400' },
  approved:           { label: 'Approved',               className: 'bg-green-500/20 text-green-400' },
  revision_requested: { label: 'Revision requested',     className: 'bg-orange-500/20 text-orange-400' },
}

export default async function CreatorDealRoomPage() {
  const applications = await getMyDealRooms()

  return (
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-6">
        <Link href="/creator" className="text-xs cr-accent hover:underline">← Back to Dashboard</Link>
        <h1 className="text-xl font-semibold cr-text-bright mt-2">Deal Room</h1>
        <p className="text-sm cr-text-muted mt-1">
          Your accepted campaigns. Submit proof of content delivery here.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="cr-panel p-8 text-center">
          <p className="cr-text-muted text-sm mb-2">No active deals yet.</p>
          <p className="text-xs cr-text-muted">
            Once a sponsor accepts your application, your deal room will appear here.
          </p>
          <Link href="/creator/campaigns" className="inline-block mt-4 text-sm cr-accent hover:underline">
            Browse campaigns
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => {
            const sub = app.deal_submission
            const subStatus = SUBMISSION_STATUS[sub?.status ?? 'pending'] ?? SUBMISSION_STATUS.pending
            return (
              <li key={app.id}>
                <Link
                  href={`/creator/deal-room/${app.id}`}
                  className="block p-4 rounded-lg border cr-border cr-bg-inner hover:border-[rgba(0,200,255,0.3)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold cr-text-bright">{app.campaign.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${subStatus.className}`}>
                          {subStatus.label}
                        </span>
                      </div>
                      {app.campaign.brand_name && (
                        <p className="text-xs cr-text-muted">{app.campaign.brand_name}</p>
                      )}
                      {app.campaign.end_date && (
                        <p className="text-xs cr-text-muted mt-0.5">
                          Deadline: {new Date(app.campaign.end_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {app.campaign.budget != null && (() => {
                        const { perCreator, creatorPool } = calcFeeBreakdown(app.campaign.budget, app.campaign.creator_count)
                        return (
                          <div>
                            <span className="text-sm font-bold cr-success">
                              ${(perCreator ?? creatorPool).toLocaleString()}
                            </span>
                            <p className="text-[10px] cr-text-muted">{perCreator ? 'your payout' : 'creator pool'}</p>
                          </div>
                        )
                      })()}
                      <p className="text-xs cr-text-muted mt-0.5">View deal →</p>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
