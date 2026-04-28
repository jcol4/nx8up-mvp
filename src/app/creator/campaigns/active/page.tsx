import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calcFeeBreakdown } from '@/lib/constants'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorRouteShell from '@/components/creator/CreatorRouteShell'

export default async function CreatorActiveCampaignsPage() {
  const [{ userId, sessionClaims }, { displayName, username }] = await Promise.all([auth(), getUserDisplayInfo()])
  if (!userId) redirect('/sign-in')

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  if (role !== 'creator' && role !== 'admin') redirect('/')

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })

  if (!creator?.id) {
    return (
      <CreatorRouteShell displayName={displayName} username={username} role={role}>
        <main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
          <div className="rounded-xl border border-white/10 bg-black/20 p-5">
            <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Campaigns</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Active Campaigns</h1>
            <p className="mt-2 text-sm text-[#a9abb5]">We could not load your creator profile.</p>
          </div>
        </main>
      </CreatorRouteShell>
    )
  }

  const applications = await prisma.campaign_applications.findMany({
    where: { creator_id: creator.id, status: 'accepted' },
    orderBy: { submitted_at: 'desc' },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          status: true,
          brand_name: true,
          end_date: true,
          budget: true,
          creator_count: true,
          sponsor: { select: { company_name: true } },
        },
      },
    },
  })

  return (
    <CreatorRouteShell displayName={displayName} username={username} role={role}>
      <main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Campaigns</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Active Campaigns</h1>
          <p className="mt-1 text-sm text-[#a9abb5]">Campaigns where your application has been accepted.</p>
        </div>

        {applications.length === 0 ? (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-8 text-center">
            <p className="text-sm text-[#a9abb5]">No active campaigns yet.</p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {applications.map((app) => {
              const campaign = app.campaign
              const { perCreator, creatorPool } =
                campaign.budget != null
                  ? calcFeeBreakdown(campaign.budget, campaign.creator_count)
                  : { perCreator: null, creatorPool: null }
              const href =
                campaign.status === 'launched' ? `/creator/deal-room/${app.id}` : `/creator/campaigns/${campaign.id}`

              return (
                <li key={app.id}>
                  <Link
                    href={href}
                    className="group block rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35 hover:bg-black/25"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">{campaign.title}</span>
                          <span className="rounded border border-[#22c55e]/30 bg-[#22c55e]/12 px-2 py-0.5 text-[11px] text-[#4ade80]">
                            Accepted
                          </span>
                          {campaign.status === 'launched' && (
                            <span className="rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-0.5 text-[11px] text-[#99f7ff]">
                              Deal Room Ready
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#a9abb5]">
                          {campaign.sponsor.company_name ?? campaign.brand_name ?? 'Sponsor'}
                          {campaign.end_date ? ` · Deadline ${new Date(campaign.end_date).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[#99f7ff]">
                          {campaign.budget != null && creatorPool != null
                            ? `$${(perCreator ?? creatorPool).toLocaleString()}`
                            : '—'}
                        </p>
                        <p className="text-[10px] text-[#a9abb5]">{perCreator ? 'your payout' : 'creator pool'}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </CreatorRouteShell>
  )
}
