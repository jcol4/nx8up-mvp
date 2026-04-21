/**
 * My Campaigns page — /sponsor/campaigns
 *
 * Lists all campaigns owned by the authenticated sponsor, split across two tabs:
 * - "Active"   — all non-launched, non-cancelled campaigns (draft → live).
 * - "Launched" — campaigns in the `launched` status (post-funding, creators notified).
 *
 * Key behaviors:
 * - If the sponsor's profile is incomplete (checked via `getMissingSponsorProfileFields`),
 *   the "New campaign" button is disabled and a warning lists the missing fields.
 * - Shows an ACH processing banner when the URL contains `?payment=processing`,
 *   which is set by the pay page after an ACH transfer is initiated.
 * - Inline action buttons (Publish, Pay Now, Launch) trigger server actions or
 *   navigate to sub-routes; Delete triggers a client-side confirmation via
 *   DeleteCampaignButton.
 * - `searchParams` is a Promise (Next.js 15 async params) and must be awaited.
 *
 * Status progression: draft → pending_payment → payment_in_progress → live → launched → completed.
 *
 * External services: Clerk (auth), Prisma.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BackLink } from '@/components/shared'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../SponsorHeader'
import DeleteCampaignButton from '@/components/sponsor/DeleteCampaignButton'
import PublishCampaignButton from '@/components/sponsor/PublishCampaignButton'
import LaunchCampaignButton from '@/components/sponsor/LaunchCampaignButton'
import { getMissingSponsorProfileFields } from '@/lib/sponsor-profile'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-[#94a3b8]/20 text-[#94a3b8]',
  pending_payment: 'bg-[#eab308]/20 text-[#eab308]',
  payment_in_progress: 'bg-[#00c8ff]/20 text-[#00c8ff]',
  pending_approval: 'bg-[#eab308]/20 text-[#eab308]',
  live: 'bg-[#22c55e]/20 text-[#22c55e]',
  launched: 'bg-[#a855f7]/20 text-[#a855f7]',
  completed: 'bg-[#00c8ff]/20 text-[#00c8ff]',
  cancelled: 'bg-[#f87171]/20 text-[#f87171]',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_payment: 'Awaiting Payment',
  payment_in_progress: 'Payment Processing',
  pending_approval: 'Pending Approval',
  live: 'Active',
  launched: 'Launched',
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

export default async function SponsorCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; payment?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) redirect('/')

  const missingFields = getMissingSponsorProfileFields(sponsor)
  const profileComplete = missingFields.length === 0

  const { tab, payment } = await searchParams
  const activeTab = tab === 'launched' ? 'launched' : 'active'

  const campaigns = await prisma.campaigns.findMany({
    where: {
      sponsor_id: sponsor.id,
      ...(activeTab === 'launched'
        ? { status: 'launched' }
        : { status: { notIn: ['launched', 'cancelled'] } }),
    },
    orderBy: { created_at: 'desc' },
    include: {
      _count: { select: { applications: true } },
      applications: { where: { status: 'accepted' }, select: { id: true }, take: 1 },
    },
  })

  const launchedCount = await prisma.campaigns.count({
    where: { sponsor_id: sponsor.id, status: 'launched' },
  })

  const activeCount = await prisma.campaigns.count({
    where: { sponsor_id: sponsor.id, status: { notIn: ['launched', 'cancelled'] } },
  })

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {payment === 'processing' && (
            <div className="mb-4 flex items-start gap-3 p-4 rounded-lg border border-[#eab308]/30 bg-[#eab308]/5">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#eab308]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#eab308]">ACH bank transfer initiated</p>
                <p className="text-xs text-[#eab308]/80 mt-0.5">Your payment is processing and will settle in 3–5 business days. Your campaign will go live automatically once the transfer clears.</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-semibold dash-text-bright mb-1">My Campaigns</h1>
              <p className="dash-text-muted text-sm">
                Manage your posted campaigns and view applicants.
              </p>
            </div>
            {profileComplete ? (
              <Link
                href="/sponsor/campaigns/new"
                className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                New campaign
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-yellow-400 font-medium">Profile incomplete</p>
                  <p className="text-xs dash-text-muted">
                    Complete your{' '}
                    <Link href="/sponsor/profile" className="text-[#00c8ff] hover:underline">
                      profile
                    </Link>{' '}
                    before posting
                  </p>
                </div>
                <span className="py-2.5 px-5 rounded-lg bg-white/5 text-[#3a5570] text-sm font-semibold cursor-not-allowed border border-white/10">
                  New campaign
                </span>
              </div>
            )}
          </div>

          {!profileComplete && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-xs text-yellow-400 font-medium mb-1">
                  Your profile is incomplete — campaigns are locked until all required fields are filled.
                </p>
                <ul className="text-xs dash-text-muted space-y-0.5">
                  {missingFields.map(f => (
                    <li key={f.label}>· <span className="text-yellow-400/80">{f.label}</span> — {f.description}</li>
                  ))}
                </ul>
                <Link href="/sponsor/profile" className="inline-block mt-2 text-xs text-[#00c8ff] hover:underline">
                  Go to profile →
                </Link>
              </div>
            </div>
          )}
          <BackLink href="/sponsor" className="mb-6 inline-block" />

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-white/10">
            <Link
              href="/sponsor/campaigns"
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'active'
                  ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                  : 'dash-text-muted hover:dash-text-bright'
              }`}
            >
              Active
              {activeCount > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-white/10">
                  {activeCount}
                </span>
              )}
            </Link>
            <Link
              href="/sponsor/campaigns?tab=launched"
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'launched'
                  ? 'text-[#a855f7] border-b-2 border-[#a855f7] -mb-px'
                  : 'dash-text-muted hover:dash-text-bright'
              }`}
            >
              Launched
              {launchedCount > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#a855f7]/20 text-[#a855f7]">
                  {launchedCount}
                </span>
              )}
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="dash-panel p-8 text-center dash-text-muted">
              {activeTab === 'launched' ? (
                <>
                  <p className="mb-2">No launched campaigns yet.</p>
                  <p className="text-xs">
                    Accept at least one creator on an active campaign, then click &quot;Launch&quot; to move it here.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-4">You haven&apos;t posted any campaigns yet.</p>
                  <Link href="/sponsor/campaigns/new" className="text-sm dash-accent hover:underline">
                    Create your first campaign
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const hasAcceptedCreator = c.applications.length > 0
                return (
                  <div
                    key={c.id}
                    className={`dash-panel p-4 ${c.status === 'launched' ? 'border border-[#a855f7]/30' : ''}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium dash-text-bright">{c.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}>
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                          {c.status === 'live' && hasAcceptedCreator && (
                            <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]">
                              Ready to launch
                            </span>
                          )}
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
                        {c.status === 'draft' && (
                          <Link
                            href={`/sponsor/campaigns/${c.id}/edit`}
                            className="text-xs dash-text-muted hover:text-[#c8dff0] transition-colors"
                          >
                            Edit
                          </Link>
                        )}
                        {c.status === 'draft' && <PublishCampaignButton id={c.id} />}
                        {c.status === 'pending_payment' && (
                          <Link
                            href={`/sponsor/campaigns/${c.id}/pay`}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#eab308] text-black font-semibold hover:opacity-90 transition-opacity"
                          >
                            Pay Now
                          </Link>
                        )}
                        {c.status === 'payment_in_progress' && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/20">
                            Processing…
                          </span>
                        )}
                        {c.status === 'live' && hasAcceptedCreator && (
                          <LaunchCampaignButton id={c.id} />
                        )}
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
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
