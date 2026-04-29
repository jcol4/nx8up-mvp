import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getDisputes } from './[disputeId]/_actions'

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-[#00c8ff]/20 text-[#00c8ff]',
  won:       'bg-green-500/20 text-green-400',
  lost:      'bg-red-500/20 text-red-400',
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

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
              <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Disputes</h1>
              <p className="mt-1 text-sm text-[#c4cad6]">
                Auto-generated evidence packages for Stripe chargebacks
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded px-2 py-1 text-xs bg-yellow-500/10 text-yellow-400">
              {disputes.filter(d => d.status === 'draft').length} draft
              </span>
              <span className="rounded px-2 py-1 text-xs bg-[#00c8ff]/10 text-[#00c8ff]">
              {disputes.filter(d => d.status === 'submitted').length} submitted
              </span>
            </div>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-10 text-center">
            <p className="text-sm text-[#c4cad6]">No disputes on record. Stripe will push new ones here automatically.</p>
          </div>
        ) : (
          <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-black/25">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Dispute ID</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Campaign</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Reason</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Due</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {disputes.map(d => {
                  const due = daysUntilDue(d.due_by)
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <Link href={`/admin/disputes/${d.id}`} className="font-mono text-xs text-[#99f7ff] hover:text-[#d7fbff] hover:underline">
                          {d.stripe_dispute_id}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-[#e8f4ff]">
                        {d.campaign?.title ?? <span className="italic text-[#a9abb5]">No campaign</span>}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#e8f4ff]">
                        ${(d.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 capitalize text-[#c4cad6]">
                        {d.reason.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_STYLES[d.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {due ? (
                          <span className={`text-xs font-medium ${due.urgent ? 'text-red-400' : 'text-[#c4cad6]'}`}>
                            {due.text}
                          </span>
                        ) : (
                          <span className="text-xs text-[#a9abb5]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#a9abb5]">
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
    </div>
  )
}
