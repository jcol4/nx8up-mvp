import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getAdminDealRoomQueue } from './_actions'
import { getAgeRestrictionChangeQueue } from '../sponsor-profile-changes/_actions'
import { getRefundRequests } from '../refund-requests/_actions'
import { getOptOutQueue } from '../opt-outs/_actions'
import { getVerificationQueueCounts } from './_queue-counts'
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
  pending:
    'rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fde047]',
  valid:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold text-[#86efac]',
  invalid:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fca5a5]',
}

function tabClass(active: boolean) {
  return `relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? '-mb-px border-b-2 border-[#99f7ff] font-semibold text-[#e8f4ff]'
      : 'cr-text-muted hover:text-[#e8f4ff]'
  }`
}

function countBadge(className: string, count: number) {
  return (
    <span
      className={`ml-1.5 rounded-full border px-1.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {count}
    </span>
  )
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

  const counts = await getVerificationQueueCounts()

  const [submissionsQueue, profileChangesQueue, launchQueue, refundRequests, optOutQueue] =
    await Promise.all([
      activeTab === 'submissions' ? getAdminDealRoomQueue() : Promise.resolve([]),
      activeTab === 'profile-changes' ? getAgeRestrictionChangeQueue() : Promise.resolve([]),
      activeTab === 'launches' ? getSanctionedLaunchQueue() : Promise.resolve([]),
      activeTab === 'refunds' ? getRefundRequests() : Promise.resolve([]),
      activeTab === 'opt-outs' ? getOptOutQueue() : Promise.resolve([]),
    ])

  const pendingRefunds = refundRequests.filter((r) => r.verdict === 'pending')
  const reviewedRefunds = refundRequests.filter((r) => r.verdict !== 'pending')

  return (
    <div className="admin-verification-queue admin-verification-queue-detail mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <div className="rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <p className="cr-field-label">Admin center</p>
        <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Review queue</h1>
        <p className="mt-2 text-sm leading-relaxed cr-text-muted">
          Review creator submissions, sponsor profile changes, sanctioned launch requests, refund requests, and creator opt-outs.
        </p>
      </div>

      <div className="mb-1 flex gap-1 overflow-x-auto border-b border-white/10">
        <Link href="/admin/verification-queue" className={tabClass(activeTab === 'submissions')}>
          Campaign submissions
          {counts.submissions > 0 &&
            countBadge('border-[#99f7ff]/30 bg-[#99f7ff]/15 text-[#bffcff]', counts.submissions)}
        </Link>
        <Link
          href="/admin/verification-queue?tab=profile-changes"
          className={tabClass(activeTab === 'profile-changes')}
        >
          Profile changes
          {counts.profileChanges > 0 &&
            countBadge('border-[#eab308]/35 bg-[#eab308]/15 text-[#fde047]', counts.profileChanges)}
        </Link>
        <Link href="/admin/verification-queue?tab=launches" className={tabClass(activeTab === 'launches')}>
          Launch approvals
          {counts.launches > 0 &&
            countBadge('border-[#f87171]/35 bg-[#f87171]/15 text-[#fca5a5]', counts.launches)}
        </Link>
        <Link href="/admin/verification-queue?tab=refunds" className={tabClass(activeTab === 'refunds')}>
          Refund requests
          {counts.pendingRefunds > 0 &&
            countBadge('border-[#eab308]/35 bg-[#eab308]/15 text-[#fde047]', counts.pendingRefunds)}
        </Link>
        <Link href="/admin/verification-queue?tab=opt-outs" className={tabClass(activeTab === 'opt-outs')}>
          Opt outs
          {counts.optOuts > 0 &&
            countBadge('border-[#c084fc]/35 bg-[#c084fc]/10 text-[#d8b4fe]', counts.optOuts)}
        </Link>
      </div>
        {/* Campaign Submissions tab */}
        {activeTab === 'submissions' && (
          submissionsQueue.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-sm cr-text-muted">
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/12 border-l-4 border-l-[#eab308] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#e8f4ff]">{app.campaign.title}</p>
                      <p className="mt-0.5 text-xs text-xs cr-stat-caption">
                        {handle}
                        {app.campaign.brand_name ? ` · ${app.campaign.brand_name}` : ''}
                        {app.campaign.end_date
                          ? ` · Deadline: ${new Date(app.campaign.end_date).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fde047]">
                        Awaiting review
                      </span>
                      {sub.submitted_at && (
                        <span className="text-xs text-xs cr-stat-caption">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#99f7ff]">Review →</span>
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
            <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-sm cr-text-muted">
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/12 border-l-4 border-l-[#eab308] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#e8f4ff]">
                        {req.sponsor.company_name ?? req.sponsor.email}
                      </p>
                      <p className="mt-0.5 text-xs text-xs cr-stat-caption">
                        Age restriction: <span className="font-semibold text-[#99f7ff]">{currentLabel}</span>
                        {' → '}
                        <span className={req.requested_age_restricted ? 'text-orange-400' : 'text-[#22c55e]'}>
                          {requestedLabel}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fde047]">
                        Pending review
                      </span>
                      <span className="text-xs text-xs cr-stat-caption">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-semibold text-[#99f7ff]">Review →</span>
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
            <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-sm cr-text-muted">
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
                      <p className="text-xs text-xs cr-stat-caption">
                        {req.sponsor.company_name ?? req.sponsor.email}
                        {req.campaign.brand_name ? ` · ${req.campaign.brand_name}` : ''}
                      </p>
                      {req.campaign.start_date && (
                        <p className="text-xs text-xs cr-stat-caption">
                          Start date: <span className="text-[#c8dff0]">{new Date(req.campaign.start_date).toLocaleDateString()}</span>
                        </p>
                      )}
                      <p className="text-xs text-xs cr-stat-caption">
                        Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
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
              <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-sm cr-text-muted">
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
                        <p className="text-xs text-xs cr-stat-caption">
                          {req.sponsor.company_name ?? req.sponsor.email}
                          {' · '}
                          <span className="text-[#c8dff0]">{TIER_LABELS[req.sponsor.reputation_tier as ReputationTier]}</span>
                          {' · score: '}
                          <span className="text-[#c8dff0]">{req.sponsor.reputation_score}</span>
                        </p>
                        <p className="text-xs text-xs cr-stat-caption">
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
                          <p className="text-xs text-xs cr-stat-caption italic">&ldquo;{req.reason_detail}&rdquo;</p>
                        )}
                        <p className="text-xs text-xs cr-stat-caption">
                          {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VERDICT_STYLES.pending}`}>
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
                <h2 className="cr-panel-title">Reviewed</h2>
                {reviewedRefunds.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4 opacity-75"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-[#c8dff0]">{req.campaign.title}</p>
                        <p className="text-xs text-xs cr-stat-caption">
                          {req.sponsor.company_name ?? req.sponsor.email}
                          {' · '}
                          Reason: <span className="text-[#c8dff0]">{REASON_LABELS[req.reason_category] ?? req.reason_category}</span>
                        </p>
                        {req.reason_detail && (
                          <p className="text-xs text-xs cr-stat-caption italic">&ldquo;{req.reason_detail}&rdquo;</p>
                        )}
                        {req.admin_notes && (
                          <p className="text-xs text-xs cr-stat-caption">Notes: {req.admin_notes}</p>
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VERDICT_STYLES[req.verdict] ?? VERDICT_STYLES.pending}`}>
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
            <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-sm cr-text-muted">
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
                        <p className="text-xs text-xs cr-stat-caption">
                          {handle}
                          {' · '}
                          <span className="text-[#c8dff0]">{TIER_LABELS[optOut.creator.reputation_tier as ReputationTier]}</span>
                          {' · score: '}
                          <span className="text-[#c8dff0]">{optOut.creator.reputation_score}</span>
                        </p>
                        <p className="text-xs text-[#c8dff0]">
                          Reason: <span className="font-medium italic">&ldquo;{optOut.reason}&rdquo;</span>
                        </p>
                        <p className="text-xs text-xs cr-stat-caption">
                          {new Date(optOut.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VERDICT_STYLES.pending}`}>
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
  )
}
