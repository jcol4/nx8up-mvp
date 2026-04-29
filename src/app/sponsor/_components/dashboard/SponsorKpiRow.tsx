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
  const toneMap: Record<string, string> = {
    cyan: 'text-[#99f7ff] border-[#99f7ff]/25 bg-[#99f7ff]/8',
    green: 'text-[#86efac] border-[#86efac]/25 bg-[#86efac]/8',
    purple: 'text-[#c4b5fd] border-[#c4b5fd]/25 bg-[#c4b5fd]/8',
    amber: 'text-[#fcd34d] border-[#fcd34d]/25 bg-[#fcd34d]/8',
  }

  return (
    <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-4 neon-glow-teal">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#a9abb5]">{label}</p>
      <p className="mt-2 font-headline text-2xl font-semibold text-[#e8f4ff]">{value}</p>
      <span className={`mt-3 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${toneMap[tone]}`}>
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

  const { liveCampaigns, totalBudget, acceptedApps, acceptanceRate } = await getSponsorKpiCached(sponsor.id)

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Live Campaigns" value={String(liveCampaigns)} delta="+2 this week" tone="cyan" />
      <KpiCard label="Total Budget" value={`$${totalBudget.toLocaleString()}`} delta="Spend is on track" tone="green" />
      <KpiCard label="Accepted Creators" value={String(acceptedApps)} delta={`${Math.max(0, acceptedApps - 2)} new this week`} tone="purple" />
      <KpiCard label="Acceptance Rate" value={`${acceptanceRate}%`} delta={acceptanceRate >= 20 ? 'Healthy pipeline' : 'Needs attention'} tone="amber" />
    </section>
  )
}
