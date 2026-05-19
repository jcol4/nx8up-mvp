import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getRefundRequests } from './_actions'
import { TIER_LABELS } from '@/lib/reputation'
import type { ReputationTier } from '@/lib/reputation'
import RefundVerdictButtons from './RefundVerdictButtons'

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

export default async function AdminRefundRequestsPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const requests = await getRefundRequests()

  const pending = requests.filter((r) => r.verdict === 'pending')
  const reviewed = requests.filter((r) => r.verdict !== 'pending')

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-nx-11 uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Refund Requests</h1>
          <p className="mt-1 text-sm text-[#c4cad6]">
            Review sponsor refund reasons and record your verdict. The Stripe refund has already been issued — your verdict adjusts the sponsor&apos;s reputation score.
          </p>
        </div>

        {pending.length === 0 && reviewed.length === 0 && (
          <div className="rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
            <p>No refund requests yet.</p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#e8f4ff]">
              Pending
              <span className="ml-2 rounded-full bg-[#eab308]/20 px-2 py-0.5 text-xs text-[#facc15]">
                {pending.length}
              </span>
            </h2>
            {pending.map((req) => (
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

        {reviewed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#a9abb5]">Reviewed</h2>
            {reviewed.map((req) => (
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
      </div>
    </div>
  )
}
