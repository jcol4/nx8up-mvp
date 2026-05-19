import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getSponsorKpiCached } from '@/lib/sponsor-dashboard-cache'

function KpiCard({
  label,
  value,
  delta,
  tone = 'cyan',
}: {
  label: string
  value: string
  delta: string
  tone?: 'cyan' | 'green' | 'purple' | 'amber'
}) {
  /** Insight chip — moderate tint + visible glow (between flat and neon). */
  const chipGlow: Record<string, string> = {
    cyan:
      'border border-[#99f7ff]/55 bg-[#99f7ff]/18 text-white shadow-[0_0_20px_-5px_rgba(153,247,255,0.32),inset_0_1px_0_rgba(255,255,255,0.1)]',
    green:
      'border border-emerald-400/55 bg-emerald-500/18 text-white shadow-[0_0_20px_-5px_rgba(52,211,153,0.28),inset_0_1px_0_rgba(255,255,255,0.1)]',
    purple:
      'border border-violet-400/55 bg-violet-500/18 text-white shadow-[0_0_20px_-5px_rgba(167,139,250,0.28),inset_0_1px_0_rgba(255,255,255,0.1)]',
    amber:
      'border border-amber-400/58 bg-amber-500/18 text-white shadow-[0_0_20px_-5px_rgba(251,191,36,0.28),inset_0_1px_0_rgba(255,255,255,0.1)]',
  }

  return (
    <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-4 neon-glow-teal">
      <p className="text-nx-11 font-medium uppercase tracking-[0.18em] text-white/90">{label}</p>
      <p className="mt-2 font-headline text-2xl font-semibold text-[#e8f4ff]">{value}</p>
      <span
        className={`mt-3 block w-full rounded-lg px-2.5 py-1.5 text-nx-11 font-semibold leading-snug ${chipGlow[tone]}`}
      >
        {delta}
      </span>
    </div>
  )
}

export default async function SponsorKpiRow() {
  const { userId } = await auth()
  if (!userId) return null

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!sponsor) return null

  const { liveCampaigns, campaignCount, totalBudget, acceptedApps, totalApps, acceptanceRate } =
    await getSponsorKpiCached(sponsor.id)

  const liveDelta =
    liveCampaigns === 0
      ? 'No live campaigns — publish one to collect applications'
      : `${liveCampaigns} live · ${totalApps} application${totalApps === 1 ? '' : 's'} in your pipeline`

  const budgetDelta =
    campaignCount === 0
      ? 'Adds the budget from every campaign in your portfolio — start with your first one'
      : `Summed budget across ${campaignCount} campaign${campaignCount === 1 ? '' : 's'}`

  const acceptedDelta =
    totalApps === 0
      ? 'No submissions yet'
      : `${acceptedApps} accepted of ${totalApps} submission${totalApps === 1 ? '' : 's'}`

  const rateDelta =
    totalApps === 0
      ? 'No data until creators apply'
      : acceptanceRate >= 20
        ? 'At or above a healthy 20% benchmark'
        : 'Below 20% — consider clearer briefs or faster review'

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Live Campaigns" value={String(liveCampaigns)} delta={liveDelta} tone="cyan" />
      <KpiCard label="Total Budget" value={`$${totalBudget.toLocaleString()}`} delta={budgetDelta} tone="green" />
      <KpiCard label="Accepted Creators" value={String(acceptedApps)} delta={acceptedDelta} tone="purple" />
      <KpiCard label="Acceptance Rate" value={`${acceptanceRate}%`} delta={rateDelta} tone="amber" />
    </section>
  )
}
