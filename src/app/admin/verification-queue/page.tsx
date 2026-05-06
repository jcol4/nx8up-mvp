import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAdminDealRoomQueue } from './_actions'
import { getAgeRestrictionChangeQueue } from '../sponsor-profile-changes/_actions'
import { getRefundRequests } from '../refund-requests/_actions'
import { getOptOutQueue } from '../opt-outs/_actions'
import SanctionedLaunchVerdictButtons from './SanctionedLaunchVerdictButtons'
import RefundVerdictButtons from '../refund-requests/RefundVerdictButtons'
import OptOutVerdictButtons from '../opt-outs/OptOutVerdictButtons'
import { TIER_LABELS } from '@/lib/reputation'
import type { ReputationTier } from '@/lib/reputation'

type Props = {
  searchParams: Promise<{ tab?: string }>
}

const REASON_LABELS: Record<string, string> = {
  budget_constraints:       'Budget constraints',
  strategy_changed:         'Campaign strategy changed',
  alternative_solution:     'Found alternative solution',
  timeline_no_longer_works: 'Timeline no longer works',
  other:                    'Other',
}

const VERDICT_STYLES: Record<string, string> = {
  pending: 'bg-[#eab308]/15 text-[#facc15] border border-[#eab308]/25',
  valid:   'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30',
  invalid: 'bg-red-500/10 text-red-400 border border-red-500/25',
}

async function getSanctionedLaunchQueue() {
  return prisma.sanctioned_launch_requests.findMany({
    where: { verdict: 'pending' },
    orderBy: { created_at: 'asc' },
    include: {
      campaign: { select: { id: true, title: true, brand_name: true, start_date: true } },
      sponsor: { select: { company_name: true, email: true } },
    },
  })
}

export default async function AdminVerificationQueuePage({ searchParams }: Props) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { tab } = await searchParams
  const activeTab = tab === 'profile-changes' ? 'profile-changes'
    : tab === 'launches' ? 'launches'
    : tab === 'refunds' ? 'refunds'
    : tab === 'opt-outs' ? 'opt-outs'
    : 'submissions'

  const [submissionsQueue, profileChangesQueue, launchQueue, refundRequests, optOutQueue] = await Promise.all([
    getAdminDealRoomQueue(),
    getAgeRestrictionChangeQueue(),
    getSanctionedLaunchQueue(),
    getRefundRequests(),
    getOptOutQueue(),
  ])

  const pendingRefunds = refundRequests.filter((r) => r.verdict === 'pending')
  const reviewedRefunds = refundRequests.filter((r) => r.verdict !== 'pending')

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Review Queue</h1>
          <p className="mt-1 text-sm text-[#c4cad6]">
            Review creator submissions, sponsor profile changes, sanctioned launch requests, refund requests, and creator opt-outs.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-1 flex gap-1 border-b border-white/10 overflow-x-auto">
          <Link
            href="/admin/verification-queue"
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Campaign Submissions
            {submissionsQueue.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#00c8ff]/20 text-[#00c8ff]">
                {submissionsQueue.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/verification-queue?tab=profile-changes"
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'profile-changes'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Profile Changes
            {profileChangesQueue.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                {profileChangesQueue.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/verification-queue?tab=launches"
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'launches'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Launch Approvals
            {launchQueue.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                {launchQueue.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/verification-queue?tab=refunds"
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'refunds'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Refund Requests
            {pendingRefunds.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#eab308]/20 text-[#facc15]">
                {pendingRefunds.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/verification-queue?tab=opt-outs"
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'opt-outs'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Opt Outs
            {optOutQueue.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                {optOutQueue.length}
              </span>
            )}
          </Link>
        </div>

        {/* Campaign Submissions tab */}
        {activeTab === 'submissions' && (
          submissionsQueue.length === 0 ? (
            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
              <p>No submissions pending review.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissionsQueue.map((sub) => {
                const app = sub.application
                const handle =
                  app.creator.twitch_username
                    ? `@${app.creator.twitch_username}`
                    : app.creator.youtube_channel_name
                      ? `@${app.creator.youtube_channel_name}`
                      : 'Creator'
                return (
                  <Link
                    key={sub.application_id}
                    href={`/admin/verification-queue/${sub.application_id}`}
                    className="glass-panel interactive-panel flex items-center justify-between gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm dash-text-bright font-medium">{app.campaign.title}</p>
                      <p className="text-xs dash-text-muted mt-0.5">
                        {handle}
                        {app.campaign.brand_name ? ` · ${app.campaign.brand_name}` : ''}
                        {app.campaign.end_date
                          ? ` · Deadline: ${new Date(app.campaign.end_date).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        Awaiting review
                      </span>
                      {sub.submitted_at && (
                        <span className="text-xs dash-text-muted">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-xs dash-text-muted">Review →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* Profile Changes tab */}
        {activeTab === 'profile-changes' && (
          profileChangesQueue.length === 0 ? (
            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
              <p>No pending age restriction change requests.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profileChangesQueue.map((req) => {
                const currentLabel = req.sponsor.age_restricted
                  ? (req.sponsor.age_restriction_type ?? 'Enabled')
                  : 'None'
                const requestedLabel = req.requested_age_restricted
                  ? (req.requested_age_restriction_type ?? 'Enabled')
                  : 'None'

                return (
                  <Link
                    key={req.id}
                    href={`/admin/sponsor-profile-changes/${req.id}`}
                    className="glass-panel interactive-panel flex items-center justify-between gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm dash-text-bright font-medium">
                        {req.sponsor.company_name ?? req.sponsor.email}
                      </p>
                      <p className="text-xs dash-text-muted mt-0.5">
                        Age restriction: <span className="dash-text">{currentLabel}</span>
                        {' → '}
                        <span className={req.requested_age_restricted ? 'text-orange-400' : 'text-[#22c55e]'}>
                          {requestedLabel}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        Pending review
                      </span>
                      <span className="text-xs dash-text-muted">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs dash-text-muted">Review →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* Launch Approvals tab */}
        {activeTab === 'launches' && (
          launchQueue.length === 0 ? (
            <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
              <p>No pending launch approval requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {launchQueue.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-white/10 border-t-2 border-t-red-500 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-[#e8f4ff]">{req.campaign.title}</p>
                      <p className="text-xs text-[#a9abb5]">
                        {req.sponsor.company_name ?? req.sponsor.email}
                        {req.campaign.brand_name ? ` · ${req.campaign.brand_name}` : ''}
                      </p>
                      {req.campaign.start_date && (
                        <p className="text-xs text-[#a9abb5]">
                          Start date: <span className="text-[#c8dff0]">{new Date(req.campaign.start_date).toLocaleDateString()}</span>
                        </p>
                      )}
                      <p className="text-xs text-[#6b7280]">
                        Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="rounded-md px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/25">
                      Sanctioned
                    </span>
                  </div>
                  <SanctionedLaunchVerdictButtons requestId={req.id} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Refund Requests tab */}
        {activeTab === 'refunds' && (
          <>
            {pendingRefunds.length === 0 && reviewedRefunds.length === 0 && (
              <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
                <p>No refund requests yet.</p>
              </div>
            )}
            {pendingRefunds.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-[#e8f4ff]">
                  Pending
                  <span className="ml-2 rounded-full bg-[#eab308]/20 px-2 py-0.5 text-xs text-[#facc15]">
                    {pendingRefunds.length}
                  </span>
                </h2>
                {pendingRefunds.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-white/10 border-t-2 border-t-[#eab308] bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-[#e8f4ff]">{req.campaign.title}</p>
                        <p className="text-xs text-[#a9abb5]">
                          {req.sponsor.company_name ?? req.sponsor.email}
                          {' · '}
                          <span className="text-[#c8dff0]">{TIER_LABELS[req.sponsor.reputation_tier as ReputationTier]}</span>
                          {' · score: '}
                          <span className="text-[#c8dff0]">{req.sponsor.reputation_score}</span>
                        </p>
                        <p className="text-xs text-[#a9abb5]">
                          Budget: <span className="text-[#99f7ff] font-medium">${req.campaign.budget?.toLocaleString() ?? '—'}</span>
                          {' · '}
                          {req.had_accepted_applications ? (
                            <span className="text-orange-400 font-medium">Had accepted creators</span>
                          ) : (
                            <span className="text-[#4ade80]">No accepted creators</span>
                          )}
                        </p>
                        <p className="text-xs text-[#c8dff0]">
                          Reason: <span className="font-medium">{REASON_LABELS[req.reason_category] ?? req.reason_category}</span>
                        </p>
                        {req.reason_detail && (
                          <p className="text-xs text-[#a9abb5] italic">&ldquo;{req.reason_detail}&rdquo;</p>
                        )}
                        <p className="text-xs text-[#6b7280]">
                          {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES.pending}`}>
                        Pending
                      </span>
                    </div>
                    <RefundVerdictButtons requestId={req.id} />
                  </div>
                ))}
              </div>
            )}
            {reviewedRefunds.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-[#a9abb5]">Reviewed</h2>
                {reviewedRefunds.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 opacity-75"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-[#c8dff0]">{req.campaign.title}</p>
                        <p className="text-xs text-[#a9abb5]">
                          {req.sponsor.company_name ?? req.sponsor.email}
                          {' · '}
                          Reason: <span className="text-[#c8dff0]">{REASON_LABELS[req.reason_category] ?? req.reason_category}</span>
                        </p>
                        {req.reason_detail && (
                          <p className="text-xs text-[#a9abb5] italic">&ldquo;{req.reason_detail}&rdquo;</p>
                        )}
                        {req.admin_notes && (
                          <p className="text-xs text-[#a9abb5]">Notes: {req.admin_notes}</p>
                        )}
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES[req.verdict] ?? VERDICT_STYLES.pending}`}>
                        {req.verdict.charAt(0).toUpperCase() + req.verdict.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Opt Outs tab */}
        {activeTab === 'opt-outs' && (
          optOutQueue.length === 0 ? (
            <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
              <p>No pending opt-out requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {optOutQueue.map((optOut) => {
                const handle = optOut.creator.twitch_username
                  ? `@${optOut.creator.twitch_username}`
                  : optOut.creator.youtube_channel_name
                    ? `@${optOut.creator.youtube_channel_name}`
                    : 'Creator'
                return (
                  <div
                    key={optOut.id}
                    className="rounded-xl border border-white/10 border-t-2 border-t-purple-500 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-[#e8f4ff]">{optOut.application.campaign.title}</p>
                        <p className="text-xs text-[#a9abb5]">
                          {handle}
                          {' · '}
                          <span className="text-[#c8dff0]">{TIER_LABELS[optOut.creator.reputation_tier as ReputationTier]}</span>
                          {' · score: '}
                          <span className="text-[#c8dff0]">{optOut.creator.reputation_score}</span>
                        </p>
                        <p className="text-xs text-[#c8dff0]">
                          Reason: <span className="font-medium italic">&ldquo;{optOut.reason}&rdquo;</span>
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {new Date(optOut.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES.pending}`}>
                        Pending
                      </span>
                    </div>
                    <OptOutVerdictButtons optOutId={optOut.id} />
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
