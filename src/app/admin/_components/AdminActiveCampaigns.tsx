import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { DashboardPanel } from '@/components/dashboard'
import { prisma } from '@/lib/prisma'

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-[#22c55e]/20 text-[#22c55e]',
  launched: 'bg-[#a855f7]/20 text-[#a855f7]',
  pending_payment: 'bg-[#f59e0b]/20 text-[#f59e0b]',
  draft: 'bg-[#94a3b8]/20 text-[#94a3b8]',
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

export default async function AdminActiveCampaigns() {
  const { campaigns, liveCount, launchedCount, pendingPaymentCount, draftCount } = await getActiveCampaignsData()

  return (
    <DashboardPanel title="Active Campaigns" href="/admin/campaigns" linkLabel="Open full table">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-[#22c55e]/20 bg-[#22c55e]/8 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#86efac]">Live</p>
          <p className="mt-1 text-sm font-semibold text-[#86efac]">{liveCount}</p>
        </div>
        <div className="rounded-md border border-[#a855f7]/20 bg-[#a855f7]/8 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#d8b4fe]">Launched</p>
          <p className="mt-1 text-sm font-semibold text-[#d8b4fe]">{launchedCount}</p>
        </div>
        <div className="rounded-md border border-[#f59e0b]/20 bg-[#f59e0b]/8 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#fcd34d]">Pending Payment</p>
          <p className="mt-1 text-sm font-semibold text-[#fcd34d]">{pendingPaymentCount}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#a9abb5]">Draft</p>
          <p className="mt-1 text-sm font-semibold dash-text-bright">{draftCount}</p>
        </div>
      </div>
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm dash-text-muted">
          No campaigns to show right now.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr] gap-3 px-1 pb-1 text-[10px] uppercase tracking-[0.14em] text-[#6f7785]">
            <span>Campaign</span>
            <span>Applications</span>
            <span>Status</span>
          </div>
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/admin/campaigns/${campaign.id}`}
              className="block rounded-lg border border-white/10 bg-black/20 p-3 transition-all hover:-translate-y-[1px] hover:border-[#99f7ff]/30"
            >
              <div className="grid grid-cols-[1.6fr_0.8fr_0.9fr] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium dash-text-bright">{campaign.title}</p>
                  <p className="mt-0.5 text-xs dash-text-muted">
                    {campaign.sponsor.company_name ?? 'Unknown sponsor'}
                    {campaign.budget != null ? ` · $${campaign.budget.toLocaleString()}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold dash-accent">
                  {campaign._count.applications}
                </span>
                <span
                  className={`inline-flex w-fit rounded px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[campaign.status] ?? 'bg-[#eab308]/20 text-[#eab308]'
                    }`}
                >
                  {campaign.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="dash-text-muted">
                  {campaign._count.applications === 0
                    ? 'No applicants yet'
                    : `${campaign._count.applications} applicant${campaign._count.applications === 1 ? '' : 's'}`}
                </span>
                <span className="dash-text-muted">
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
