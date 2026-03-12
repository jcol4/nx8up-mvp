import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Sponsors — nx8up Admin' }

export default async function AdminSponsorsPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const sponsors = await prisma.sponsors.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      _count: { select: { campaigns: true } },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dash-text-bright">Sponsors</h1>
          <p className="text-sm dash-text-muted mt-0.5">
            {sponsors.length} registered sponsor{sponsors.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {sponsors.length === 0 ? (
        <div className="dash-panel p-8 text-center">
          <p className="dash-text-muted text-sm">No sponsors registered yet.</p>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Company</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Email</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Location</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Budget</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Campaigns</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    i === sponsors.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3 dash-text-bright font-medium">
                    {s.company_name ?? <span className="dash-text-muted italic">No name</span>}
                  </td>
                  <td className="px-4 py-3 dash-text-muted">{s.email}</td>
                  <td className="px-4 py-3 dash-text-muted">{s.location ?? '—'}</td>
                  <td className="px-4 py-3 dash-text-muted">
                    {s.budget_min != null && s.budget_max != null
                      ? `$${s.budget_min.toLocaleString()} – $${s.budget_max.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#00c8ff] font-semibold">
                      {s._count.campaigns}
                    </span>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/sponsors/${s.id}`}
                      className="text-xs text-[#00c8ff] hover:underline"
                    >
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