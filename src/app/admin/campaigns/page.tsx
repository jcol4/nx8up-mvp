import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Campaigns — nx8up Admin' }
const PAGE_SIZE = 25

const STATUS_BADGE: Record<string, string> = {
  live: 'border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]',
  draft: 'border-white/20 bg-white/[0.06] text-[#cbd5e1]',
  cancelled: 'border-red-400/35 bg-red-500/10 text-[#fca5a5]',
}

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { page: pageParam } = await searchParams
  const pageNumber = Number(pageParam)
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.floor(pageNumber) : 1

  const [total, statusCounts] = await Promise.all([
    prisma.campaigns.count(),
    prisma.campaigns.groupBy({ by: ['status'], _count: { status: true } }),
  ])

  const countByStatus: Record<string, number> = {}
  for (const s of statusCounts) countByStatus[s.status] = s._count.status
  const live = countByStatus.live ?? 0
  const draft = countByStatus.draft ?? 0
  const other = Math.max(0, total - live - draft)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const campaigns = await prisma.campaigns.findMany({
    orderBy: { created_at: 'desc' },
    take: PAGE_SIZE,
    skip: (safePage - 1) * PAGE_SIZE,
    include: {
      sponsor: { select: { company_name: true } },
      _count: { select: { applications: true } },
    },
  })

  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)

  function buildUrl(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams({
      page: String(safePage),
      ...overrides,
    })
    return `/admin/campaigns?${params.toString()}`
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-nx-11 uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
              <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Campaigns</h1>
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
                  <span className="font-bold text-[#4ade80] drop-shadow-[0_0_10px_rgba(34,197,94,0.25)]">
                    {live}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#86efac]/90">
                    live
                  </span>
                </span>
                <span className="select-none text-white/20" aria-hidden>
                  ·
                </span>
                <span className="tabular-nums">
                  <span className="font-bold text-[#cbd5e1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                    {draft}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-white/50">
                    draft
                  </span>
                </span>
                {other > 0 && (
                  <>
                    <span className="select-none text-white/20" aria-hidden>
                      ·
                    </span>
                    <span className="tabular-nums">
                      <span className="font-bold text-[#bffcff] drop-shadow-[0_0_10px_rgba(153,247,255,0.22)]">
                        {other}
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
        </div>

        {campaigns.length === 0 ? (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
            <p className="text-sm font-medium text-white/90">No campaigns yet.</p>
          </div>
        ) : (
          <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b-2 border-[#99f7ff]/35 bg-gradient-to-r from-black/55 via-[#070d14] to-black/50">
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Campaign</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Sponsor</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Platforms</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Budget</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Applications</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Status</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">End date</th>
                    <th className="px-4 py-3.5 text-right text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {campaigns.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-white/[0.04] transition-colors hover:bg-[#99f7ff]/[0.06] ${
                        i % 2 === 0 ? 'bg-black/[0.12]' : 'bg-transparent'
                      } ${i === campaigns.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/campaigns/${c.id}`}
                          className="font-semibold text-[#bffcff] transition-colors hover:text-white hover:underline decoration-[#99f7ff]/50 underline-offset-2"
                        >
                          {c.title}
                        </Link>
                        {c.campaign_type && (
                          <p className="mt-0.5 text-xs font-medium capitalize text-white/75">{c.campaign_type}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-nx-13 leading-snug text-white/75">
                        {c.sponsor.company_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {c.platform.length > 0
                            ? c.platform.map((p) => (
                                <span
                                  key={p}
                                  className="rounded-md border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-1.5 py-0.5 text-nx-11 font-medium text-[#bffcff]"
                                >
                                  {p}
                                </span>
                              ))
                            : (
                                <span className="text-xs font-medium text-white/35">—</span>
                              )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top font-medium tabular-nums text-white/90">
                        {c.budget != null ? `$${c.budget.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="font-semibold tabular-nums text-[#99f7ff]">{c._count.applications}</span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-nx-11 font-semibold capitalize ${
                            STATUS_BADGE[c.status] ?? 'border-[#eab308]/35 bg-[#eab308]/12 text-[#fde047]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs font-semibold tabular-nums text-[#99f7ff]/90">
                        {c.end_date
                          ? new Date(c.end_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <Link
                          href={`/admin/campaigns/${c.id}`}
                          className="whitespace-nowrap text-nx-11 font-semibold text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="glass-panel interactive-panel flex items-center gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-3 text-sm">
            {safePage > 1 && (
              <Link
                href={buildUrl({ page: String(safePage - 1) })}
                className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 font-medium text-white/90 transition-colors hover:border-[#99f7ff]/35 hover:text-[#bffcff]"
              >
                ← Previous
              </Link>
            )}
            <span className="font-medium text-white/90">
              Page {safePage} of {totalPages}
            </span>
            {safePage < totalPages && (
              <Link
                href={buildUrl({ page: String(safePage + 1) })}
                className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 font-medium text-white/90 transition-colors hover:border-[#99f7ff]/35 hover:text-[#bffcff]"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
