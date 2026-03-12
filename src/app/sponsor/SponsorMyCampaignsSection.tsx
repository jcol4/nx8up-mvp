import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DashboardPanel } from '@/components/dashboard'

export default async function SponsorMyCampaignsSection() {
  const { userId } = await auth()
  if (!userId) {
    // Nothing to show if not authenticated; layout will handle redirect at page level
    return null
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
  })

  if (!sponsor) {
    return null
  }

  const campaigns = await prisma.campaigns.findMany({
    where: { sponsor_id: sponsor.id },
    orderBy: { created_at: 'desc' },
    take: 3,
    include: {
      _count: { select: { applications: true } },
    },
  })

  return (
    <DashboardPanel title="My Campaigns" href="/sponsor/campaigns" linkLabel="View all">
      {campaigns.length === 0 ? (
        <div className="dash-bg-inner dash-border border rounded-lg p-4 text-sm dash-text-muted">
          <p className="mb-2">You haven&apos;t launched any campaigns yet.</p>
          <Link href="/sponsor/campaigns/new" className="dash-accent hover:underline">
            Post a campaign to start reaching creators.
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href="/sponsor/campaigns"
              className="block p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#00c8ff]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium dash-text-bright">{c.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    c.status === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#eab308]/20 text-[#eab308]'
                  }`}
                >
                  {c.status === 'active' ? 'Active' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>
              <p className="text-xs dash-text-muted mt-0.5">
                {(c.game_category?.length ? c.game_category.join(' · ') : 'Gaming')}{' '}
                {c.budget != null && `· $${c.budget.toLocaleString()}`}
              </p>
              <p className="text-xs dash-accent mt-1">
                {c._count.applications > 0
                  ? `${c._count.applications} applicant${c._count.applications === 1 ? '' : 's'}`
                  : 'No applicants yet'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
