import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Campaigns — nx8up Admin' }
const PAGE_SIZE = 25

const STATUS_STYLE: Record<string, string> = {
  live:      'bg-[#22c55e]/20 text-[#22c55e]',
  draft:     'bg-[#94a3b8]/20 text-[#94a3b8]',
  cancelled: 'bg-[#f87171]/20 text-[#f87171]',
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

  const [campaigns, total, statusCounts] = await Promise.all([
    prisma.campaigns.findMany({
      orderBy: { created_at: 'desc' },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: {
        sponsor: { select: { company_name: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.campaigns.count(),
    prisma.campaigns.groupBy({ by: ['status'], _count: { status: true } }),
  ])

  const countByStatus: Record<string, number> = {}
  for (const s of statusCounts) countByStatus[s.status] = s._count.status
  const live = countByStatus.live ?? 0
  const draft = countByStatus.draft ?? 0
  const other = total - live - draft
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)

  function buildPageUrl(nextPage: number) {
    return `/admin/campaigns?page=${nextPage}`
  }

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
              <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Campaigns</h1>
              <p className="mt-1 text-sm text-[#c4cad6]">
                {total.toLocaleString()} total · {live} live · {draft} draft{other > 0 ? ` · ${other} other` : ''}
              </p>
            </div>
            {total > 0 && (
              <div className="flex items-center gap-3">
                <p className="text-xs text-[#a9abb5]">
                  {startIndex + 1}-{endIndex} of {total}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildPageUrl(Math.max(1, safePage - 1))}
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
                      href={buildPageUrl(Math.min(totalPages, safePage + 1))}
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
          <p className="text-sm text-[#c4cad6]">No campaigns yet.</p>
        </div>
      ) : (
        <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Campaign</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Sponsor</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Platforms</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Budget</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Applications</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">End date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    i === campaigns.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#e8f4ff]">{c.title}</p>
                    {c.campaign_type && (
                      <p className="mt-0.5 text-xs capitalize text-[#a9abb5]">{c.campaign_type}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#c4cad6]">
                    {c.sponsor.company_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.platform.length > 0
                        ? c.platform.map(p => (
                            <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{p}</span>
                          ))
                        : <span className="text-xs text-[#a9abb5]">—</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#c4cad6]">
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
                  <td className="px-4 py-3 text-[#a9abb5]">
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
        </div>
      )}
      </div>
    </div>
  )
}
