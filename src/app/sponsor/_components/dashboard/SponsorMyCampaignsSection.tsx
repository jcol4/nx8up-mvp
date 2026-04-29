import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getSponsorMyCampaignsPreviewCached } from '@/lib/sponsor-dashboard-cache'
import { DashboardPanel } from '@/components/dashboard'

export default async function SponsorMyCampaignsSection() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })

  if (!sponsor) {
    return null
  }

  const campaigns = await getSponsorMyCampaignsPreviewCached(sponsor.id)

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
              className="block p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#99f7ff]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium dash-text-bright">{c.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    c.status === 'live'
                      ? 'bg-[#22c55e]/20 text-[#22c55e]'
                      : c.status === 'pending_approval'
                        ? 'bg-[#eab308]/20 text-[#eab308]'
                        : c.status === 'completed'
                          ? 'bg-[#00c8ff]/20 text-[#00c8ff]'
                          : c.status === 'cancelled'
                            ? 'bg-[#f87171]/20 text-[#f87171]'
                            : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                  }`}
                >
                  {c.status === 'pending_approval' ? 'Pending Approval' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>
              <p className="text-xs dash-text-muted mt-0.5">
                {(c.game_category?.length ? c.game_category.join(' · ') : 'Gaming')}{' '}
                {c.budget != null && `· $${c.budget.toLocaleString()}`}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs dash-accent">
                  {c._count.applications > 0
                    ? `${c._count.applications} applicant${c._count.applications === 1 ? '' : 's'}`
                    : 'No applicants yet'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
