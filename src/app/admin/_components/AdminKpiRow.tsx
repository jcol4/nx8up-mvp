import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

function KpiCard({
  label,
  value,
  hint,
  tone = 'cyan',
}: {
  label: string
  value: string
  hint: string
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
        {hint}
      </span>
    </div>
  )
}

const getAdminKpis = unstable_cache(
  async () => {
    const [campaigns, submittedDeals, creators, sponsors] = await Promise.all([
      prisma.campaigns.count(),
      prisma.deal_submissions.count({ where: { status: 'submitted' } }),
      prisma.content_creators.count(),
      prisma.sponsors.count(),
    ])
    return { campaigns, submittedDeals, creators, sponsors }
  },
  ['admin-kpis'],
  { revalidate: 20 },
)

export default async function AdminKpiRow() {
  const { campaigns, submittedDeals, creators, sponsors } = await getAdminKpis()

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="Total Campaigns" value={campaigns.toLocaleString()} hint="Platform-wide" tone="cyan" />
      <KpiCard label="Pending Reviews" value={submittedDeals.toLocaleString()} hint="Needs moderator action" tone="amber" />
      <KpiCard label="Active Creators" value={creators.toLocaleString()} hint="Eligible to apply" tone="purple" />
      <KpiCard label="Sponsors" value={sponsors.toLocaleString()} hint="Brand partners onboarded" tone="green" />
    </section>
  )
}
