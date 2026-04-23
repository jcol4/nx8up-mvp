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
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold dash-text-bright">Disputes</h1>
            <p className="text-sm dash-text-muted mt-0.5">
              Auto-generated evidence packages for Stripe chargebacks
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">
              {disputes.filter(d => d.status === 'draft').length} draft
            </span>
            <span className="text-xs px-2 py-1 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
              {disputes.filter(d => d.status === 'submitted').length} submitted
            </span>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="dash-panel p-10 text-center">
            <p className="dash-text-muted text-sm">No disputes on record. Stripe will push new ones here automatically.</p>
          </div>
        ) : (
          <div className="dash-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e3a5f]">
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Dispute ID</th>
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Campaign</th>
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Amount</th>
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Reason</th>
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Due</th>
                  <th className="text-left text-xs dash-text-muted uppercase tracking-wide px-5 py-3">Received</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => {
                  const due = daysUntilDue(d.due_by)
                  return (
                    <tr key={d.id} className="border-b border-[#1e3a5f]/50 hover:bg-[#0a1628]/60 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/admin/disputes/${d.id}`} className="dash-accent hover:underline font-mono text-xs">
                          {d.stripe_dispute_id}
                        </Link>
                      </td>
                      <td className="px-5 py-3 dash-text-bright">
                        {d.campaign?.title ?? <span className="dash-text-muted italic">No campaign</span>}
                      </td>
                      <td className="px-5 py-3 dash-text-bright font-medium">
                        ${(d.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3 dash-text-muted capitalize">
                        {d.reason.replace(/_/g, ' ')}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_STYLES[d.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {due ? (
                          <span className={`text-xs font-medium ${due.urgent ? 'text-red-400' : 'dash-text-muted'}`}>
                            {due.text}
                          </span>
                        ) : (
                          <span className="dash-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 dash-text-muted text-xs">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
