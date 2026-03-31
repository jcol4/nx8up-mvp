import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Campaigns — nx8up Admin' }

const STATUS_STYLE: Record<string, string> = {
  live:      'bg-[#22c55e]/20 text-[#22c55e]',
  draft:     'bg-[#94a3b8]/20 text-[#94a3b8]',
  cancelled: 'bg-[#f87171]/20 text-[#f87171]',
}

export default async function AdminCampaignsPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const campaigns = await prisma.campaigns.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      sponsor: { select: { company_name: true } },
      _count: { select: { applications: true } },
    },
  })

  const live    = campaigns.filter(c => c.status === 'live').length
  const draft   = campaigns.filter(c => c.status === 'draft').length
  const other   = campaigns.length - live - draft

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dash-text-bright">Campaigns</h1>
          <p className="text-sm dash-text-muted mt-0.5">
            {campaigns.length} total · {live} live · {draft} draft{other > 0 ? ` · ${other} other` : ''}
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="dash-panel p-8 text-center">
          <p className="dash-text-muted text-sm">No campaigns yet.</p>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Campaign</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Sponsor</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Platforms</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Budget</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Applications</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">End date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    i === campaigns.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="dash-text-bright font-medium">{c.title}</p>
                    {c.campaign_type && (
                      <p className="text-xs dash-text-muted capitalize mt-0.5">{c.campaign_type}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {c.sponsor.company_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.platform.length > 0
                        ? c.platform.map(p => (
                            <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{p}</span>
                          ))
                        : <span className="text-xs dash-text-muted">—</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {c.budget != null ? `$${c.budget.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#00c8ff] font-semibold">{c._count.applications}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_STYLE[c.status] ?? 'bg-[#eab308]/20 text-[#eab308]'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {c.end_date
                      ? new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/campaigns/${c.id}`} className="text-xs text-[#00c8ff] hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
