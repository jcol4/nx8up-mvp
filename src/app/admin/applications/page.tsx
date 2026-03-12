import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Applications — nx8up Admin' }

const PAGE_SIZE = 25

type Props = {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const { page: pageParam, status, search: searchParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1'))
  const statusFilter = status ?? ''
  const search = searchParam?.trim() ?? ''  
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search
      ? {
          OR: [
            { campaign: { title: { contains: search, mode: 'insensitive' as const } } },
            { creator: { email: { contains: search, mode: 'insensitive' as const } } },
            { creator: { twitch_username: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [applications, total] = await Promise.all([
    prisma.campaign_applications.findMany({
      where,
      orderBy: { submitted_at: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        campaign: {
          include: { sponsor: true },
        },
        creator: true,
      },
    }),
    prisma.campaign_applications.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statusCounts = await prisma.campaign_applications.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  const countByStatus: Record<string, number> = {}
  for (const s of statusCounts) {
    countByStatus[s.status] = s._count.status
  }

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
      page: String(page),
      ...overrides,
    })
    return `/admin/applications?${params.toString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dash-text-bright">Applications</h1>
          <p className="text-sm dash-text-muted mt-0.5">
            {total.toLocaleString()} total application{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
        ].map(({ label, value }) => (
          <Link
            key={value}
            href={buildUrl({ status: value, page: '1' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === value
                ? 'bg-[#00c8ff] text-black'
                : 'dash-panel dash-text-muted hover:dash-text-bright'
            }`}
          >
            {label}
            {value && countByStatus[value] != null ? (
              <span className="ml-1.5 opacity-70">({countByStatus[value]})</span>
            ) : null}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/applications" className="flex gap-2">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by campaign, creator email, or Twitch username..."
          className="flex-1 px-3 py-2 rounded-lg text-sm dash-panel dash-text-bright placeholder:dash-text-muted border border-white/10 focus:outline-none focus:border-[#00c8ff]/50 bg-transparent"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm font-medium hover:bg-[#00c8ff]/30 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="dash-panel p-8 text-center">
          <p className="dash-text-muted text-sm">No applications match your filters.</p>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Creator</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Campaign</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Sponsor</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Message</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    i === applications.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="dash-text-bright font-medium">
                      {a.creator.twitch_username ?? a.creator.email}
                    </p>
                    {a.creator.twitch_username && (
                      <p className="text-xs dash-text-muted">{a.creator.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="dash-text-bright">{a.campaign.title}</p>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {a.campaign.sponsor.company_name ?? a.campaign.sponsor.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        a.status === 'accepted'
                          ? 'bg-green-500/10 text-green-400'
                          : a.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-[#7b4fff]/10 text-[#7b4fff]'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 dash-text-muted max-w-[200px]">
                    {a.message ? (
                      <span className="truncate block" title={a.message}>
                        {a.message.length > 60 ? a.message.slice(0, 60) + '…' : a.message}
                      </span>
                    ) : (
                      <span className="italic opacity-40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {a.submitted_at
                      ? new Date(a.submitted_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 rounded-lg dash-panel dash-text-muted hover:dash-text-bright transition-colors">
              ← Previous
            </Link>
          )}
          <span className="dash-text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 rounded-lg dash-panel dash-text-muted hover:dash-text-bright transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}