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

  const [total, statusCounts] = await Promise.all([
    prisma.campaign_applications.count({ where }),
    prisma.campaign_applications.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const applications = await prisma.campaign_applications.findMany({
    where,
    orderBy: { submitted_at: 'desc' },
    take: PAGE_SIZE,
    skip: (safePage - 1) * PAGE_SIZE,
    include: {
      campaign: {
        include: { sponsor: true },
      },
      creator: true,
    },
  })

  const countByStatus: Record<string, number> = {}
  for (const s of statusCounts) {
    countByStatus[s.status] = s._count.status
  }

  const pendingCount = countByStatus.pending ?? 0
  const acceptedCount = countByStatus.accepted ?? 0
  const rejectedCount = countByStatus.rejected ?? 0
  const otherAppCount = Math.max(0, total - pendingCount - acceptedCount - rejectedCount)

  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
      page: String(safePage),
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
            <p className="text-nx-11 uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
            <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Applications</h1>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-sm">
              <span className="tabular-nums">
                <span className="font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  {total.toLocaleString()}
                </span>
                <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-white/55">
                  total
                </span>
              </span>
              <span className="select-none text-white/20" aria-hidden>
                ·
              </span>
              <span className="tabular-nums">
                <span className="font-bold text-[#eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  {pendingCount}
                </span>
                <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#fcd34d]/90">
                  pending
                </span>
              </span>
              <span className="select-none text-white/20" aria-hidden>
                ·
              </span>
              <span className="tabular-nums">
                <span className="font-bold text-[#4ade80] drop-shadow-[0_0_10px_rgba(34,197,94,0.25)]">
                  {acceptedCount}
                </span>
                <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#86efac]/90">
                  accepted
                </span>
              </span>
              <span className="select-none text-white/20" aria-hidden>
                ·
              </span>
              <span className="tabular-nums">
                <span className="font-bold text-[#f87171] drop-shadow-[0_0_8px_rgba(248,113,113,0.15)]">
                  {rejectedCount}
                </span>
                <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#fca5a5]/90">
                  rejected
                </span>
              </span>
              {otherAppCount > 0 && (
                <>
                  <span className="select-none text-white/20" aria-hidden>
                    ·
                  </span>
                  <span className="tabular-nums">
                    <span className="font-bold text-[#bffcff] drop-shadow-[0_0_10px_rgba(153,247,255,0.22)]">
                      {otherAppCount}
                    </span>
                    <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#99f7ff]/90">
                      other
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-white/90">
                {startIndex + 1}-{endIndex} of {total}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Link
                    href={buildUrl({ page: String(Math.max(1, safePage - 1)) })}
                    aria-disabled={safePage <= 1}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                      safePage <= 1
                        ? 'pointer-events-none border-white/10 text-white/30'
                        : 'border-[#99f7ff]/30 text-[#99f7ff] hover:bg-[#99f7ff]/10'
                    }`}
                  >
                    &larr;
                  </Link>
                  <Link
                    href={buildUrl({ page: String(Math.min(totalPages, safePage + 1)) })}
                    aria-disabled={safePage >= totalPages}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                      safePage >= totalPages
                        ? 'pointer-events-none border-white/10 text-white/30'
                        : 'border-[#99f7ff]/30 text-[#99f7ff] hover:bg-[#99f7ff]/10'
                    }`}
                  >
                    &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 border-t border-white/10 pt-3 space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              { label: 'All', value: '', activeClass: 'border-[#99f7ff]/50 bg-[#99f7ff]/18 text-[#bffcff] shadow-[0_0_20px_rgba(153,247,255,0.12)]', idleClass: 'border-white/10 bg-black/30 text-white/80 hover:border-[#99f7ff]/30' },
              { label: 'Pending', value: 'pending', activeClass: 'border-[#eab308]/45 bg-[#eab308]/15 text-[#fde047]', idleClass: 'border-[#eab308]/20 bg-[#eab308]/[0.07] text-[#fcd34d]/90 hover:border-[#eab308]/40' },
              { label: 'Accepted', value: 'accepted', activeClass: 'border-[#22c55e]/45 bg-[#22c55e]/14 text-[#bbf7d0]', idleClass: 'border-[#22c55e]/20 bg-[#22c55e]/[0.07] text-[#86efac]/90 hover:border-[#22c55e]/40' },
              { label: 'Rejected', value: 'rejected', activeClass: 'border-red-400/45 bg-red-500/15 text-[#fecaca]', idleClass: 'border-red-500/20 bg-red-500/[0.07] text-red-300/90 hover:border-red-400/35' },
            ].map(({ label, value, activeClass, idleClass }) => (
              <Link
                key={value}
                href={buildUrl({ status: value, page: '1' })}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all ${statusFilter === value
                    ? activeClass
                    : idleClass
                  }`}
              >
                {label}
                {value && countByStatus[value] != null ? (
                  <span
                    className={`ml-1.5 tabular-nums ${statusFilter === value ? 'opacity-95' : 'opacity-80'}`}
                  >
                    ({countByStatus[value]})
                  </span>
                ) : value === '' ? (
                  <span className={`ml-1.5 tabular-nums ${statusFilter === '' ? 'opacity-95' : 'opacity-70'}`}>
                    ({total.toLocaleString()})
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <form method="GET" action="/admin/applications" className="flex gap-2">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by campaign, creator email, or Twitch username..."
              className="flex-1 rounded-lg border border-white/12 bg-black/20 px-3 py-2 text-sm text-[#e8f4ff] placeholder:text-white/35 focus:border-[#99f7ff]/50 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg border border-[#99f7ff]/45 bg-[#99f7ff]/15 px-4 py-2 text-sm font-semibold text-[#bffcff] transition hover:border-[#99f7ff]/70 hover:bg-[#99f7ff]/22 hover:text-[#e8f4ff]"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
          <p className="text-sm font-medium text-white/90">No applications match your filters.</p>
        </div>
      ) : (
        <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-sm">
            <thead>
              <tr className="border-b-2 border-[#99f7ff]/35 bg-gradient-to-r from-black/55 via-[#070d14] to-black/50">
                <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Creator</th>
                <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Campaign</th>
                <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Sponsor</th>
                <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Status</th>
                <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Message</th>
                <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Submitted</th>
                <th className="px-4 py-3.5 text-right text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {applications.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-b border-white/[0.04] transition-colors hover:bg-[#99f7ff]/[0.06] ${
                    i % 2 === 0 ? 'bg-black/[0.12]' : 'bg-transparent'
                  } ${i === applications.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-[#f4fdff]">
                      {a.creator.twitch_username ?? a.creator.email}
                    </p>
                    {a.creator.twitch_username && (
                      <p className="mt-0.5 text-xs font-medium tracking-wide text-[#99f7ff]/75">
                        {a.creator.email}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/campaigns/${a.campaign.id}`}
                      className="font-semibold text-[#bffcff] transition-colors hover:text-white hover:underline decoration-[#99f7ff]/50 underline-offset-2"
                    >
                      {a.campaign.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-nx-13 leading-snug text-white/75">
                    {a.campaign.sponsor.company_name ?? a.campaign.sponsor.email}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-nx-11 font-semibold capitalize ${
                        a.status === 'accepted'
                          ? 'border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]'
                          : a.status === 'rejected'
                            ? 'border-red-400/35 bg-red-500/10 text-[#fca5a5]'
                            : a.status === 'opted_out'
                              ? 'border-orange-400/35 bg-orange-500/12 text-[#fdba74]'
                              : 'border-[#eab308]/35 bg-[#eab308]/12 text-[#fde047]'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-4 py-3 align-top">
                    {a.message ? (
                      <span
                        className="block rounded-md border border-white/8 bg-black/25 px-2 py-1.5 text-xs leading-snug text-white/80"
                        title={a.message}
                      >
                        {a.message.length > 60 ? a.message.slice(0, 60) + '…' : a.message}
                      </span>
                    ) : (
                      <span className="text-xs font-medium italic text-white/35">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs font-semibold tabular-nums text-[#99f7ff]/90">
                    {a.submitted_at
                      ? new Date(a.submitted_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <Link
                        href={`/admin/campaigns/${a.campaign.id}`}
                        className="whitespace-nowrap text-nx-11 font-semibold text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                      >
                        Campaign
                      </Link>
                      <Link
                        href={`/admin/users/creators/${a.creator.id}`}
                        className="whitespace-nowrap text-nx-11 font-semibold text-white/70 hover:text-[#99f7ff] hover:underline"
                      >
                        Creator
                      </Link>
                    </div>
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
          {safePage > 1 && (
            <Link href={buildUrl({ page: String(safePage - 1) })} className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 font-medium text-white/90 transition-colors hover:border-[#99f7ff]/35 hover:text-[#bffcff]">
              ← Previous
            </Link>
          )}
          <span className="font-medium text-white/90">
            Page {safePage} of {totalPages}
          </span>
          {safePage < totalPages && (
            <Link href={buildUrl({ page: String(safePage + 1) })} className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 font-medium text-white/90 transition-colors hover:border-[#99f7ff]/35 hover:text-[#bffcff]">
              Next →
            </Link>
          )}
        </div>
      )}
      </div>
    </div>
  )
}