import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getDisputes } from './[disputeId]/_actions'

const STATUS_STYLES: Record<string, string> = {
  draft:
    'rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fde047]',
  submitted:
    'rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#bffcff]',
  won:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  lost:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
}

function daysUntilDue(date: Date | null): { text: string; urgent: boolean } | null {
  if (!date) return null
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { text: 'Past due', urgent: true }
  if (days === 0) return { text: 'Due today', urgent: true }
  return { text: `${days}d`, urgent: days <= 3 }
}

export default async function AdminDisputesPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const disputes = await getDisputes()
  const draftCount = disputes.filter(d => d.status === 'draft').length
  const submittedCount = disputes.filter(d => d.status === 'submitted').length

  return (
    <div className="admin-disputes mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="cr-field-label">Admin center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Disputes</h1>
          <p className="mt-2 text-sm leading-relaxed cr-text-muted">
            Auto-generated evidence packages for Stripe chargebacks
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-1 text-xs font-semibold text-[#fde047]">
            {draftCount} draft
          </span>
          <span className="rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-1 text-xs font-semibold text-[#bffcff]">
            {submittedCount} submitted
          </span>
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-10 text-center">
          <p className="text-sm font-medium text-[#e8f4ff]">No disputes on record</p>
          <p className="mt-1 text-sm cr-text-muted">
            Stripe will push new ones here automatically.
          </p>
        </div>
      ) : (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20">
          <div className="overflow-x-auto">
            <table className="sp-ledger-table w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 text-left">Dispute ID</th>
                  <th className="px-5 py-3 text-left">Campaign</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Reason</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Due</th>
                  <th className="px-5 py-3 text-left">Received</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => {
                  const due = daysUntilDue(d.due_by)
                  return (
                    <tr key={d.id} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/disputes/${d.id}`}
                          className="font-mono text-xs text-[#bffcff] hover:text-[#99f7ff] hover:underline"
                        >
                          {d.stripe_dispute_id}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#e8f4ff]">
                        {d.campaign?.title ?? (
                          <span className="italic cr-stat-caption">No campaign</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums text-[#e8f4ff]">
                        ${(d.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 capitalize cr-text">{d.reason.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`${STATUS_STYLES[d.status] ?? 'rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-200'}`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {due ? (
                          <span
                            className={`text-xs font-semibold ${due.urgent ? 'text-[#fca5a5]' : 'cr-stat-caption'}`}
                          >
                            {due.text}
                          </span>
                        ) : (
                          <span className="cr-stat-caption">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums cr-stat-caption">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
