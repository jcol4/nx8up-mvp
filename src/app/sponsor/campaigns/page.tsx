import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import DeleteCampaignButton from '@/components/sponsor/DeleteCampaignButton'
import PublishCampaignButton from '@/components/sponsor/PublishCampaignButton'
import LaunchCampaignButton from '@/components/sponsor/LaunchCampaignButton'
import { getMissingSponsorProfileFields } from '@/lib/sponsor-profile'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-white/10 text-[#a9abb5] border border-white/10',
  pending_payment: 'bg-[#eab308]/15 text-[#facc15] border border-[#eab308]/25',
  payment_in_progress: 'bg-[#99f7ff]/12 text-[#99f7ff] border border-[#99f7ff]/25',
  pending_approval: 'bg-[#eab308]/15 text-[#facc15] border border-[#eab308]/25',
  live: 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30',
  launched: 'bg-[#c084fc]/15 text-[#d8b4fe] border border-[#c084fc]/30',
  completed: 'bg-[#99f7ff]/10 text-[#99f7ff] border border-[#99f7ff]/20',
  cancelled: 'bg-red-500/10 text-red-400 border border-red-500/25',
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

  const [campaigns, launchedCount, activeCount] = await Promise.all([
    prisma.campaigns.findMany({
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
    }),
    prisma.campaigns.count({
      where: { sponsor_id: sponsor.id, status: 'launched' },
    }),
    prisma.campaigns.count({
      where: { sponsor_id: sponsor.id, status: { notIn: ['launched', 'cancelled'] } },
    }),
  ])

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          {payment === 'processing' && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#eab308]/30 bg-[#eab308]/5 p-4">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#eab308]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-[#eab308]">ACH bank transfer initiated</p>
                <p className="mt-0.5 text-xs text-[#eab308]/85">
                  Your payment is processing and will settle in 3–5 business days. Your campaign will go live automatically
                  once the transfer clears.
                </p>
              </div>
            </div>
          )}
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Campaigns</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">My Campaigns</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#a9abb5]">
                Manage your posted campaigns and view applicants.
              </p>
            </div>
            {profileComplete ? (
              <Link
                href="/sponsor/campaigns/new"
                className="shrink-0 rounded-lg bg-[#99f7ff] py-2.5 px-5 text-center text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90 sm:self-start"
              >
                New campaign
              </Link>
            ) : (
              <div className="flex shrink-0 items-center gap-3 sm:self-start">
                <div className="text-right">
                  <p className="text-xs font-medium text-yellow-400">Profile incomplete</p>
                  <p className="text-xs text-[#a9abb5]">
                    Complete your{' '}
                    <Link href="/sponsor/profile" className="text-[#99f7ff] underline-offset-2 hover:underline">
                      profile
                    </Link>{' '}
                    before posting
                  </p>
                </div>
                <span className="cursor-not-allowed rounded-lg border border-white/10 bg-white/5 py-2.5 px-5 text-sm font-semibold text-[#5c6578]">
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
                <ul className="space-y-0.5 text-xs text-[#a9abb5]">
                  {missingFields.map(f => (
                    <li key={f.label}>· <span className="text-yellow-400/80">{f.label}</span> — {f.description}</li>
                  ))}
                </ul>
                <Link href="/sponsor/profile" className="mt-2 inline-block text-xs text-[#99f7ff] underline-offset-2 hover:underline">
                  Go to profile →
                </Link>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-5 flex gap-0.5 border-b border-white/10 sm:mb-6">
            <Link
              href="/sponsor/campaigns"
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'active'
                  ? '-mb-px border-b-2 border-[#99f7ff] font-semibold text-[#e8f4ff]'
                  : 'text-[#a9abb5] hover:text-[#e8f4ff]'
              }`}
            >
              Active
              {activeCount > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === 'active' ? 'bg-[#99f7ff]/15 text-[#99f7ff]' : 'bg-white/10 text-[#a9abb5]'
                  }`}
                >
                  {activeCount}
                </span>
              )}
            </Link>
            <Link
              href="/sponsor/campaigns?tab=launched"
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === 'launched'
                  ? '-mb-px border-b-2 border-[#c084fc] font-semibold text-[#e9d5ff]'
                  : 'text-[#a9abb5] hover:text-[#e8f4ff]'
              }`}
            >
              Launched
              {launchedCount > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === 'launched' ? 'bg-[#c084fc]/20 text-[#d8b4fe]' : 'bg-white/10 text-[#a9abb5]'
                  }`}
                >
                  {launchedCount}
                </span>
              )}
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="dash-panel dash-panel--nx-top p-8 text-center text-[#a9abb5]">
              {activeTab === 'launched' ? (
                <>
                  <p className="mb-2 text-[#e8f4ff]">No launched campaigns yet.</p>
                  <p className="text-xs leading-relaxed">
                    Accept at least one creator on an active campaign, then click &quot;Launch&quot; to move it here.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-4 text-[#e8f4ff]">You haven&apos;t posted any campaigns yet.</p>
                  <Link href="/sponsor/campaigns/new" className="text-sm font-medium text-[#99f7ff] underline-offset-2 hover:underline">
                    Create your first campaign
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c) => {
                const hasAcceptedCreator = c.applications.length > 0
                const chipBase =
                  'inline-flex items-center rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[11px] text-[#c8dff0]'
                return (
                  <div
                    key={c.id}
                    className={`dash-panel dash-panel--nx-top p-4 sm:p-5 ${
                      c.status === 'launched' ? 'ring-1 ring-[#c084fc]/20' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-headline text-base font-semibold text-[#e8f4ff] sm:text-lg">{c.title}</span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}
                          >
                            {STATUS_LABELS[c.status] ?? c.status}
                          </span>
                          {c.status === 'live' && hasAcceptedCreator && (
                            <span className="rounded-md border border-[#c084fc]/35 bg-[#c084fc]/10 px-2 py-0.5 text-xs font-medium text-[#d8b4fe]">
                              Ready to launch
                            </span>
                          )}
                        </div>

                        {c.campaign_code && (
                          <p className="mb-2 font-mono text-xs tracking-wide text-[#6b7280]">{c.campaign_code}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {c.brand_name && <span className={chipBase}>{c.brand_name}</span>}
                          {c.objective && (
                            <span className={chipBase}>{OBJECTIVE_LABELS[c.objective] ?? c.objective}</span>
                          )}
                          {c.campaign_type && (
                            <span className={chipBase}>{CAMPAIGN_TYPE_LABELS[c.campaign_type] ?? c.campaign_type}</span>
                          )}
                          {c.payment_model && (
                            <span className={chipBase}>{PAYMENT_MODEL_LABELS[c.payment_model] ?? c.payment_model}</span>
                          )}
                          {c.budget != null && (
                            <span className="inline-flex items-center rounded-md border border-[#99f7ff]/30 bg-[#99f7ff]/[0.08] px-2 py-1 text-[11px] font-semibold text-[#99f7ff]">
                              ${c.budget.toLocaleString()}
                            </span>
                          )}
                          {c.end_date && (
                            <span className={`${chipBase} text-[#a9abb5]`}>
                              Ends {new Date(c.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                        {c.status === 'draft' && (
                          <Link
                            href={`/sponsor/campaigns/${c.id}/edit`}
                            className="text-xs text-[#a9abb5] transition-colors hover:text-[#99f7ff]"
                          >
                            Edit
                          </Link>
                        )}
                        {c.status === 'draft' && <PublishCampaignButton id={c.id} />}
                        {c.status === 'pending_payment' && (
                          <Link
                            href={`/sponsor/campaigns/${c.id}/pay`}
                            className="rounded-lg bg-[#eab308] px-2.5 py-1 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                          >
                            Pay Now
                          </Link>
                        )}
                        {c.status === 'payment_in_progress' && (
                          <span className="rounded-lg border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-xs text-[#99f7ff]">
                            Processing…
                          </span>
                        )}
                        {c.status === 'live' && hasAcceptedCreator && <LaunchCampaignButton id={c.id} />}
                        {c._count.applications > 0 ? (
                          <Link
                            href={`/sponsor/campaigns/${c.id}/applications`}
                            className="text-sm font-medium text-[#99f7ff] underline-offset-2 hover:underline"
                          >
                            {c._count.applications} applicant{c._count.applications !== 1 ? 's' : ''}
                          </Link>
                        ) : (
                          <span className="text-sm text-[#6b7280]">No applicants</span>
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
