import { auth } from '@clerk/nextjs/server'
import { getTranslations, getFormatter } from 'next-intl/server'
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

  const t = await getTranslations('sponsor.dashboard')
  const format = await getFormatter()

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!sponsor) return null

  const { liveCampaigns, campaignCount, totalBudget, acceptedApps, totalApps, acceptanceRate } =
    await getSponsorKpiCached(sponsor.id)

  const liveDelta =
    liveCampaigns === 0
      ? t('kpiLiveDeltaEmpty')
      : t('kpiLiveDelta', { live: liveCampaigns, apps: totalApps })

  const budgetDelta =
    campaignCount === 0
      ? t('kpiBudgetDeltaEmpty')
      : t('kpiBudgetDelta', { n: campaignCount })

  const acceptedDelta =
    totalApps === 0
      ? t('kpiAcceptedDeltaEmpty')
      : t('kpiAcceptedDelta', { accepted: acceptedApps, total: totalApps })

  const rateDelta =
    totalApps === 0
      ? t('kpiRateDeltaEmpty')
      : acceptanceRate >= 20
        ? t('kpiRateDeltaHealthy')
        : t('kpiRateDeltaLow')

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={t('kpiLiveCampaigns')} value={String(liveCampaigns)} delta={liveDelta} tone="cyan" />
      <KpiCard label={t('kpiTotalBudget')} value={`$${format.number(totalBudget)}`} delta={budgetDelta} tone="green" />
      <KpiCard label={t('kpiAcceptedCreators')} value={String(acceptedApps)} delta={acceptedDelta} tone="purple" />
      <KpiCard label={t('kpiAcceptanceRate')} value={`${acceptanceRate}%`} delta={rateDelta} tone="amber" />
    </section>
  )
}
