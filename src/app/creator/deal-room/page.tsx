/**
 * Creator Deal Room listing page (`/creator/deal-room`).
 *
 * Server component that shows all accepted campaign applications where the
 * campaign is in "launched" status. Each card displays:
 *  - Campaign title and brand name.
 *  - Submission status (derived from `deal_submission.status`).
 *  - Payout amount (per-creator if creator_count is set, else full creator pool).
 *  - Content delivery deadline.
 *
 * Submission statuses and their display labels are defined in
 * `SUBMISSION_STATUS`. The "pending" fallback is used when no
 * `deal_submission` row exists yet.
 *
 * Each card links to the individual deal room page for that application.
 *
 * External services: Prisma/PostgreSQL (via `getMyDealRooms`).
 */
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getMyDealRooms } from './_actions'
import { calcFeeBreakdown } from '@/lib/constants'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorRouteShell from '@/components/creator/CreatorRouteShell'

const SUBMISSION_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Not submitted', className: 'border border-white/12 bg-white/8 text-[#a9abb5]' },
  submitted: { label: 'Pending review', className: 'border border-yellow-500/30 bg-yellow-500/15 text-yellow-300' },
  admin_verified: { label: 'Verified - awaiting sponsor', className: 'border border-[#99f7ff]/30 bg-[#99f7ff]/12 text-[#99f7ff]' },
  admin_rejected: { label: 'Rejected - resubmit', className: 'border border-red-500/30 bg-red-500/15 text-red-300' },
  approved: { label: 'Approved', className: 'border border-green-500/30 bg-green-500/15 text-green-300' },
  revision_requested: { label: 'Revision requested', className: 'border border-orange-500/30 bg-orange-500/15 text-orange-300' },
}

const DEAL_CARD_CLASS =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-4 transition-colors'

export default async function CreatorDealRoomPage() {
  const [{ sessionClaims }, { displayName, username }] = await Promise.all([auth(), getUserDisplayInfo()])
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const applications = await getMyDealRooms()

  return (
    <CreatorRouteShell displayName={displayName} username={username} role={role}>
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Deal Room</p>
        <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Deal Room</h1>
        <p className="mt-1 text-sm text-[#a9abb5]">
          Your accepted campaigns. Submit proof of content delivery here.
        </p>
        <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-[11px] text-[#99f7ff]">
          {applications.length} active {applications.length === 1 ? 'deal' : 'deals'}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-8 text-center">
          <p className="mb-2 text-sm text-[#a9abb5]">No active deals yet.</p>
          <p className="text-xs text-[#a9abb5]">
            Once a sponsor accepts your application, your deal room will appear here.
          </p>
          <Link
            href="/creator/campaigns"
            className="mt-4 inline-block rounded-md border border-[#99f7ff]/35 bg-[#99f7ff]/12 px-4 py-2 text-sm font-medium text-[#99f7ff] transition-colors hover:bg-[#99f7ff]/18"
          >
            Browse campaigns
          </Link>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {applications.map((app) => {
            const sub = app.deal_submission
            const subStatus = SUBMISSION_STATUS[sub?.status ?? 'pending'] ?? SUBMISSION_STATUS.pending
            return (
              <li key={app.id}>
                <Link
                  href={`/creator/deal-room/${app.id}`}
                  className={`group block ${DEAL_CARD_CLASS} hover:border-[#99f7ff]/35 hover:bg-black/25`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">{app.campaign.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${subStatus.className}`}>
                          {subStatus.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {app.campaign.brand_name && (
                          <span className="rounded border border-white/12 bg-white/6 px-2 py-0.5 text-[11px] text-[#a9abb5]">
                            {app.campaign.brand_name}
                          </span>
                        )}
                        {(app.campaign.platform ?? []).map((platform) => (
                          <span
                            key={platform}
                            className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-[#99f7ff]"
                          >
                            {platform}
                          </span>
                        ))}
                        {app.campaign.end_date && (
                          <span className="rounded border border-white/12 bg-white/6 px-2 py-0.5 text-[11px] text-[#a9abb5]">
                            Due {new Date(app.campaign.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {app.campaign.budget != null && (() => {
                        const { perCreator, creatorPool } = calcFeeBreakdown(app.campaign.budget, app.campaign.creator_count)
                        return (
                          <div>
                            <span className="text-sm font-bold text-emerald-300">
                              ${(perCreator ?? creatorPool).toLocaleString()}
                            </span>
                            <p className="text-[10px] text-[#a9abb5]">{perCreator ? 'your payout' : 'creator pool'}</p>
                          </div>
                        )
                      })()}
                      <p className="mt-2 text-xs font-medium text-[#99f7ff] transition-colors group-hover:text-[#c9fbff]">View deal →</p>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
    </CreatorRouteShell>
  )
}
