import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { DashboardPanel } from '@/components/dashboard'
import { prisma } from '@/lib/prisma'

const STATUS_STYLES: Record<string, string> = {
  live: 'border border-[#22c55e]/30 bg-[#22c55e]/15 text-[#86efac]',
  launched: 'border border-[#99f7ff]/35 bg-[#99f7ff]/12 text-[#bffcff]',
  pending_payment: 'border border-[#f59e0b]/30 bg-[#f59e0b]/12 text-[#fcd34d]',
  draft: 'border border-white/15 bg-white/[0.06] text-white/90',
}

const getActiveCampaignsData = unstable_cache(
  async () => {
    const [campaigns, statusCounts] = await Promise.all([
      prisma.campaigns.findMany({
        where: {
          status: { in: ['live', 'launched', 'pending_payment', 'draft'] },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          sponsor: { select: { company_name: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.campaigns.groupBy({
        by: ['status'],
        where: { status: { in: ['live', 'launched', 'pending_payment', 'draft'] } },
        _count: { status: true },
      }),
    ])

    const counts = Object.fromEntries(statusCounts.map((row) => [row.status, row._count.status]))

    return {
      campaigns,
      liveCount: counts.live ?? 0,
      launchedCount: counts.launched ?? 0,
      pendingPaymentCount: counts.pending_payment ?? 0,
      draftCount: counts.draft ?? 0,
    }
  },
  ['admin-active-campaigns'],
  { revalidate: 20 },
)

const statBox =
  'rounded-md border p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition hover:brightness-105'

export default async function AdminActiveCampaigns() {
  const { campaigns, liveCount, launchedCount, pendingPaymentCount, draftCount } = await getActiveCampaignsData()

  return (
    <DashboardPanel title="Active Campaigns" href="/admin/campaigns" linkLabel="Open full table">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className={`${statBox} border-[#22c55e]/20 bg-[#22c55e]/8`}>
          <p className="text-nx-10 font-semibold uppercase tracking-[0.16em] text-[#86efac] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            Live
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {liveCount}
          </p>
        </div>
        <div className={`${statBox} border-[#99f7ff]/25 bg-[#99f7ff]/8`}>
          <p className="text-nx-10 font-semibold uppercase tracking-[0.16em] text-[#bffcff] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            Launched
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {launchedCount}
          </p>
        </div>
        <div className={`${statBox} border-[#f59e0b]/20 bg-[#f59e0b]/8`}>
          <p className="text-nx-10 font-semibold uppercase tracking-[0.16em] text-[#fcd34d] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            Pending Payment
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {pendingPaymentCount}
          </p>
        </div>
        <div className={`${statBox} border-white/12 bg-black/25`}>
          <p className="text-nx-10 font-semibold uppercase tracking-[0.16em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            Draft
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {draftCount}
          </p>
        </div>
      </div>
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-center text-sm font-medium text-white">
          No campaigns to show right now.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr] gap-3 px-1 pb-1 text-nx-10 font-bold uppercase tracking-[0.18em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            <span>Campaign</span>
            <span>Applications</span>
            <span>Status</span>
          </div>
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/admin/campaigns/${campaign.id}`}
              className="block rounded-lg border border-white/10 bg-black/20 p-3.5 transition-all hover:-translate-y-[1px] hover:border-[#99f7ff]/30"
            >
              <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr] items-start gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-nx-15 font-bold leading-snug tracking-tight text-[#f4fdff] drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]">
                    {campaign.title}
                  </p>
                  <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-nx-11 leading-snug">
                    <span className="font-medium tracking-wide text-[#99f7ff]/90">
                      {campaign.sponsor.company_name ?? 'Unknown sponsor'}
                    </span>
                    {campaign.budget != null ? (
                      <>
                        <span className="select-none text-white/20" aria-hidden>
                          ·
                        </span>
                        <span className="tabular-nums text-nx-13 font-semibold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]">
                          ${campaign.budget.toLocaleString()}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="pt-0.5 text-base font-bold tabular-nums leading-none text-[#99f7ff] drop-shadow-[0_0_12px_rgba(153,247,255,0.4)]">
                  {campaign._count.applications}
                </span>
                <span
                  className={`inline-flex w-fit rounded px-2 py-0.5 text-nx-10 font-semibold capitalize ${STATUS_STYLES[campaign.status] ?? 'border border-[#eab308]/25 bg-[#eab308]/15 text-[#eab308]'
                    }`}
                >
                  {campaign.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-nx-11">
                {campaign._count.applications === 0 ? (
                  <span className="font-medium tracking-wide text-white/55">
                    No applicants yet
                  </span>
                ) : (
                  <span className="text-white/70">
                    <span className="tabular-nums text-sm font-bold text-[#99f7ff] drop-shadow-[0_0_8px_rgba(153,247,255,0.25)]">
                      {campaign._count.applications}
                    </span>
                    <span className="ml-1 font-medium tracking-tight">
                      applicant{campaign._count.applications === 1 ? '' : 's'}
                    </span>
                  </span>
                )}
                <span className="shrink-0 tabular-nums font-medium tracking-tight text-white/50">
                  {campaign.end_date
                    ? `Ends ${new Date(campaign.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'No end date'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
