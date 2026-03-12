import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BackLink } from '@/components/shared'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../SponsorHeader'
import DeleteCampaignButton from '@/components/sponsor/DeleteCampaignButton'

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
              className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90"
            >
              Post campaign
            </Link>
          </div>
          <BackLink href="/sponsor" className="mb-6 inline-block" />

          {campaigns.length === 0 ? (
            <div className="dash-panel p-8 text-center dash-text-muted">
              <p className="mb-4">You haven&apos;t posted any campaigns yet.</p>
              <Link
                href="/sponsor/campaigns/new"
                className="text-sm dash-accent hover:underline"
              >
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="dash-panel p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium dash-text-bright">{c.title}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          c.status === 'active'
                            ? 'bg-[#22c55e]/20 text-[#22c55e]'
                            : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs dash-text-muted">
                      {c.platform?.length ? c.platform.join(' · ') : '—'}
                      {c.budget != null && ` · $${c.budget.toLocaleString()}`}
                      {c.deadline && ` · Due ${new Date(c.deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c._count.applications > 0 ? (
                      <Link
                        href={`/sponsor/campaigns/${c.id}/applications`}
                        className="text-sm dash-accent hover:underline"
                      >
                        {c._count.applications} applicant{c._count.applications !== 1 ? 's' : ''}
                      </Link>
                    ) : (
                      <span className="text-sm dash-text-muted">No applicants yet</span>
                    )}
                    <DeleteCampaignButton id={c.id} />
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
