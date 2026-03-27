import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BackLink } from '@/components/shared'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../SponsorHeader'
import DeleteCampaignButton from '@/components/sponsor/DeleteCampaignButton'
import PublishCampaignButton from '@/components/sponsor/PublishCampaignButton'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[#94a3b8]/20 text-[#94a3b8]',
  pending_approval: 'bg-[#eab308]/20 text-[#eab308]',
  live: 'bg-[#22c55e]/20 text-[#22c55e]',
  completed: 'bg-[#00c8ff]/20 text-[#00c8ff]',
  cancelled: 'bg-[#f87171]/20 text-[#f87171]',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const OBJECTIVE_LABELS: Record<string, string> = {
  awareness: 'Awareness',
  engagement: 'Engagement',
  traffic: 'Traffic',
  conversions: 'Conversions',
}

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  one_time: 'One-time',
  ongoing: 'Ongoing',
  milestone_based: 'Milestone-based',
}

const PAYMENT_MODEL_LABELS: Record<string, string> = {
  fixed_per_creator: 'Fixed per creator',
  performance_based: 'Performance-based',
  hybrid: 'Hybrid',
}

export default async function SponsorCampaignsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) redirect('/')

  const campaigns = await prisma.campaigns.findMany({
    where: { sponsor_id: sponsor.id },
    orderBy: { created_at: 'desc' },
    include: { _count: { select: { applications: true } } },
  })

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-semibold dash-text-bright mb-1">My Campaigns</h1>
              <p className="dash-text-muted text-sm">
                Manage your posted campaigns and view applicants.
              </p>
            </div>
            <Link
              href="/sponsor/campaigns/new"
              className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              New campaign
            </Link>
          </div>
          <BackLink href="/sponsor" className="mb-6 inline-block" />

          {campaigns.length === 0 ? (
            <div className="dash-panel p-8 text-center dash-text-muted">
              <p className="mb-4">You haven&apos;t posted any campaigns yet.</p>
              <Link href="/sponsor/campaigns/new" className="text-sm dash-accent hover:underline">
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="dash-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium dash-text-bright">{c.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </div>

                      {c.campaign_code && (
                        <p className="text-xs font-mono dash-text-muted mb-1">{c.campaign_code}</p>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs dash-text-muted">
                        {c.brand_name && <span>{c.brand_name}</span>}
                        {c.objective && <span>{OBJECTIVE_LABELS[c.objective] ?? c.objective}</span>}
                        {c.campaign_type && <span>{CAMPAIGN_TYPE_LABELS[c.campaign_type] ?? c.campaign_type}</span>}
                        {c.payment_model && <span>{PAYMENT_MODEL_LABELS[c.payment_model] ?? c.payment_model}</span>}
                        {c.budget != null && <span>${c.budget.toLocaleString()}</span>}
                        {c.end_date && <span>Ends {new Date(c.end_date).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {c.status === 'draft' && <PublishCampaignButton id={c.id} />}
                      {c._count.applications > 0 ? (
                        <Link
                          href={`/sponsor/campaigns/${c.id}/applications`}
                          className="text-sm dash-accent hover:underline"
                        >
                          {c._count.applications} applicant{c._count.applications !== 1 ? 's' : ''}
                        </Link>
                      ) : (
                        <span className="text-sm dash-text-muted">No applicants</span>
                      )}
                      <DeleteCampaignButton id={c.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
