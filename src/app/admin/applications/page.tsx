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

  const [applications, total, statusCounts] = await Promise.all([
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
    prisma.campaign_applications.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

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
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
            <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Applications</h1>
            <p className="mt-1 text-sm text-[#c4cad6]">
              {total.toLocaleString()} total application{total !== 1 ? 's' : ''}
            </p>
          </div>
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
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === value
                ? 'border border-[#99f7ff]/45 bg-[#99f7ff]/15 text-[#bffcff]'
                : 'border border-white/12 bg-black/20 text-[#a9abb5] hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]'
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
          className="flex-1 rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-sm text-[#e8f4ff] placeholder:text-[#8f97ab] focus:border-[#99f7ff]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-[#99f7ff]/45 bg-[#99f7ff]/15 px-4 py-2 text-sm font-semibold text-[#bffcff] transition hover:border-[#99f7ff]/70 hover:bg-[#99f7ff]/22 hover:text-[#e8f4ff]"
        >
          Search
        </button>
      </form>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
          <p className="text-sm text-[#c4cad6]">No applications match your filters.</p>
        </div>
      ) : (
        <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Creator</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Campaign</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Sponsor</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Message</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {applications.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === applications.length - 1 ? 'border-b-0' : ''
                    }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#e8f4ff]">
                      {a.creator.twitch_username ?? a.creator.email}
                    </p>
                    {a.creator.twitch_username && (
                      <p className="text-xs text-[#a9abb5]">{a.creator.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[#e8f4ff]">{a.campaign.title}</p>
                  </td>
                  <td className="px-4 py-3 text-[#c4cad6]">
                    {a.campaign.sponsor.company_name ?? a.campaign.sponsor.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${a.status === 'accepted'
                          ? 'bg-green-500/10 text-green-400'
                          : a.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-[#7b4fff]/10 text-[#7b4fff]'
                        }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-[#c4cad6]">
                    {a.message ? (
                      <span className="truncate block" title={a.message}>
                        {a.message.length > 60 ? a.message.slice(0, 60) + '…' : a.message}
                      </span>
                    ) : (
                      <span className="italic opacity-40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#a9abb5]">
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
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-panel interactive-panel flex items-center gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-3 text-sm">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]">
              ← Previous
            </Link>
          )}
          <span className="text-[#c4cad6]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]">
              Next →
            </Link>
          )}
        </div>
      )}
      </div>
    </div>
  )
}