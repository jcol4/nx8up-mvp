/**
 * Creator Campaigns listing page (`/creator/campaigns`).
 *
 * Server component with three tabs driven by the `?tab=` query param:
 *  - **Open**    (default) — live campaigns the creator is eligible for,
 *                            ranked by match score, score >= 75 only.
 *  - **Invites** — campaigns where the creator has an "invited" application.
 *  - **Launched** — campaigns that have been fully launched; shows the
 *                   creator's own application status if they applied.
 *
 * Access is gated by two checks performed before tab data is fetched:
 *  1. **Stripe ready** — creator must have a complete Stripe Connect account.
 *     Incomplete → shown a "set up payout" prompt.
 *  2. **Platform verified** — creator must have at least one OAuth-connected
 *     platform (Twitch or YouTube). Missing → shown a "connect platform" prompt.
 *
 * Tab data is fetched lazily — only the active tab's data is fetched.
 *
 * Budget figures are displayed as the "creator pool" (budget minus nx8up fee),
 * computed by `calcFeeBreakdown`.
 *
 * External services: Prisma/PostgreSQL (via server actions).
 */
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getOpenCampaignsWithEligibility, getLaunchedCampaigns, getCreatorOAuthStatus, getMyInvitations } from './_actions'
import Panel from '@/components/shared/Panel'
import InviteResponseButtons from '@/components/creator/InviteResponseButtons'
import { calcFeeBreakdown } from '@/lib/constants'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorRouteShell from '@/components/creator/CreatorRouteShell'

const APPLICATION_STATUS_STYLES: Record<string, string> = {
  accepted: 'border border-green-500/30 bg-green-500/15 text-green-300',
  pending: 'border border-yellow-500/30 bg-yellow-500/15 text-yellow-300',
  rejected: 'border border-white/12 bg-white/8 text-[#a9abb5]',
}

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepted',
  pending: 'Applied',
  rejected: 'Not selected',
}

const CREATOR_CAMPAIGN_CARD_CLASS =
  'dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 transition-colors'
const CREATOR_CAMPAIGN_EMPTY_CLASS =
  'dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-0'

export default async function CreatorCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const [{ sessionClaims }, { displayName, username }] = await Promise.all([auth(), getUserDisplayInfo()])
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { verified, stripeReady } = await getCreatorOAuthStatus()

  if (!stripeReady) {
    return (
      <CreatorRouteShell displayName={displayName} username={username} role={role}>
      <main className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Campaigns</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Open Campaigns</h1>
        </div>
        <Panel variant="creator" className="dash-panel dash-panel--nx-top rounded-xl p-0">
          <div className="text-center py-10 px-4">
            <p className="mb-2 text-base font-semibold text-[#e8f4ff]">Set up your payout account first</p>
            <p className="mb-6 text-sm text-[#a9abb5]">
              You need to connect a Stripe payout account before you can browse or apply to campaigns. This ensures you can receive payments from sponsors.
            </p>
            <Link
              href="/creator/profile"
              className="inline-block rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-300 transition-colors hover:bg-yellow-500/20"
            >
              Set up payout account
            </Link>
          </div>
        </Panel>
      </main>
      </CreatorRouteShell>
    )
  }

  if (!verified) {
    return (
      <CreatorRouteShell displayName={displayName} username={username} role={role}>
      <main className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Campaigns</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Open Campaigns</h1>
        </div>
        <Panel variant="creator" className="dash-panel dash-panel--nx-top rounded-xl p-0">
          <div className="text-center py-10 px-4">
            <p className="mb-2 text-base font-semibold text-[#e8f4ff]">Connect a platform to view campaigns</p>
            <p className="mb-6 text-sm text-[#a9abb5]">
              You need to connect at least one verified platform — Twitch or YouTube — before you can browse sponsor campaigns.
            </p>
            <Link
              href="/creator/profile"
              className="inline-block rounded-md border border-[#99f7ff]/35 bg-[#99f7ff]/12 px-4 py-2 text-sm font-medium text-[#99f7ff] transition-colors hover:bg-[#99f7ff]/18"
            >
              Go to Profile Settings
            </Link>
          </div>
        </Panel>
      </main>
      </CreatorRouteShell>
    )
  }

  const { tab, page } = await searchParams
  const activeTab = tab === 'launched' ? 'launched' : tab === 'invites' ? 'invites' : 'open'
  const pageNumber = Number(page)
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.floor(pageNumber) : 1
  const pageSize = 25

  const [allEntries, launchedEntries, invitations] = await Promise.all([
    activeTab === 'open' ? getOpenCampaignsWithEligibility(500) : Promise.resolve([]),
    activeTab === 'launched' ? getLaunchedCampaigns(500) : Promise.resolve([]),
    activeTab === 'invites' ? getMyInvitations() : Promise.resolve([]),
  ])

  const openEntries = allEntries.filter((e) => e.eligible).sort((a, b) => b.score - a.score)
  const totalEntries =
    activeTab === 'invites' ? invitations.length : activeTab === 'open' ? openEntries.length : launchedEntries.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageStartLabel = totalEntries === 0 ? 0 : startIndex + 1
  const pageEndLabel = totalEntries === 0 ? 0 : Math.min(endIndex, totalEntries)
  const paginatedInvitations = invitations.slice(startIndex, endIndex)
  const paginatedOpenEntries = openEntries.slice(startIndex, endIndex)
  const paginatedLaunchedEntries = launchedEntries.slice(startIndex, endIndex)

  const buildCampaignsHref = (tabValue: 'open' | 'invites' | 'launched', nextPage: number) => {
    const params = new URLSearchParams()
    if (tabValue !== 'open') params.set('tab', tabValue)
    if (nextPage > 1) params.set('page', String(nextPage))
    const query = params.toString()
    return query ? `/creator/campaigns?${query}` : '/creator/campaigns'
  }

  return (
    <CreatorRouteShell displayName={displayName} username={username} role={role}>
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Campaigns</p>
        <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Campaigns</h1>
        <p className="mt-1 text-sm text-[#a9abb5]">Browse and apply to sponsor campaigns.</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-white/10">
        <Link
          href="/creator/campaigns"
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'open'
              ? 'text-[#e8f4ff] border-b-2 border-[#99f7ff] -mb-px'
              : 'text-[#a9abb5] hover:text-[#e8f4ff]'
          }`}
        >
          Open
        </Link>
        <Link
          href="/creator/campaigns?tab=invites"
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'invites'
              ? 'text-[#99f7ff] border-b-2 border-[#99f7ff] -mb-px'
              : 'text-[#a9abb5] hover:text-[#e8f4ff]'
          }`}
        >
          Invites
        </Link>
        <Link
          href="/creator/campaigns?tab=launched"
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'launched'
              ? 'text-[#a855f7] border-b-2 border-[#a855f7] -mb-px'
              : 'text-[#a9abb5] hover:text-[#e8f4ff]'
          }`}
        >
          Launched
        </Link>
      </div>

      {totalEntries > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-xs text-[#a9abb5]">
            {pageStartLabel}-{pageEndLabel} of {totalEntries}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildCampaignsHref(activeTab, Math.max(1, safePage - 1))}
              aria-disabled={safePage <= 1}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                safePage <= 1
                  ? 'pointer-events-none border-white/10 text-white/30'
                  : 'border-[#99f7ff]/30 text-[#99f7ff] hover:bg-[#99f7ff]/10'
              }`}
            >
              &larr;
            </Link>
            <Link
              href={buildCampaignsHref(activeTab, Math.min(totalPages, safePage + 1))}
              aria-disabled={safePage >= totalPages}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                safePage >= totalPages
                  ? 'pointer-events-none border-white/10 text-white/30'
                  : 'border-[#99f7ff]/30 text-[#99f7ff] hover:bg-[#99f7ff]/10'
              }`}
            >
              &rarr;
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'invites' ? (
        invitations.length === 0 ? (
          <Panel variant="creator" className={CREATOR_CAMPAIGN_EMPTY_CLASS}>
            <p className="py-8 text-center text-sm text-[#a9abb5]">No pending invitations.</p>
          </Panel>
        ) : (
          <ul className="space-y-3.5">
            {paginatedInvitations.map((app) => {
              const c = app.campaign
              return (
                <li
                  key={app.id}
                  className={CREATOR_CAMPAIGN_CARD_CLASS}
                  style={{ borderTopWidth: '2px', borderTopColor: '#bffcff' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[#e8f4ff]">{c.title}</span>
                        <span className="rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]">
                          Invited
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#a9abb5]">
                        {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                        {c.platform.join(', ')}
                        {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
                      </p>
                      {c.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[#e8f4ff]">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.game_category.slice(0, 3).map((g: string) => (
                          <span key={g} className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]">{g}</span>
                        ))}
                        {c.content_type.slice(0, 2).map((t: string) => (
                          <span key={t} className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]">{t}</span>
                        ))}
                      </div>
                      <Link
                        href={`/creator/campaigns/${c.id}`}
                        className="mt-2 inline-block text-xs text-[#99f7ff] hover:underline"
                      >
                        View campaign details →
                      </Link>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {c.budget != null && (() => {
                        const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                        return (
                          <div className="text-right">
                            <span className="text-sm font-bold cr-success">${creatorPool.toLocaleString()}</span>
                            <p className="text-[10px] text-[#a9abb5]">creator pool</p>
                          </div>
                        )
                      })()}
                      <InviteResponseButtons applicationId={app.id} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )
      ) : activeTab === 'open' ? (
        openEntries.length === 0 ? (
          <Panel variant="creator" className={CREATOR_CAMPAIGN_EMPTY_CLASS}>
            <p className="py-8 text-center text-sm text-[#a9abb5]">No open campaigns right now. Check back soon!</p>
          </Panel>
        ) : (
          <ul className="space-y-3.5">
            {paginatedOpenEntries.map(({ campaign: c, score }) => (
              <li key={c.id}>
                <Link
                  href={`/creator/campaigns/${c.id}`}
                  className={`group block ${CREATOR_CAMPAIGN_CARD_CLASS} hover:border-[#99f7ff]/35`}
                  style={{ borderTopWidth: '2px', borderTopColor: '#bffcff' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">{c.title}</span>
                      <p className="mt-0.5 text-xs text-[#a9abb5]">
                        {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                        {c.platform.join(', ')}
                        {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
                      </p>
                      {c.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[#e8f4ff]">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.game_category.slice(0, 3).map((g: string) => (
                          <span key={g} className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]">{g}</span>
                        ))}
                        {c.content_type.slice(0, 2).map((t: string) => (
                          <span key={t} className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {c.budget != null && (() => {
                        const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                        return (
                          <>
                            <span className="text-sm font-bold cr-success">${creatorPool.toLocaleString()}</span>
                            <p className="text-[10px] text-[#a9abb5]">creator pool</p>
                          </>
                        )
                      })()}
                      <p className="mt-0.5 text-xs text-[#a9abb5]">{c._count.applications} applied</p>
                      <p className={`text-xs font-medium mt-1 ${
                        score >= 75 ? 'text-green-400' : score >= 45 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {score}% match
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        launchedEntries.length === 0 ? (
          <Panel variant="creator" className={CREATOR_CAMPAIGN_EMPTY_CLASS}>
            <p className="py-8 text-center text-sm text-[#a9abb5]">No launched campaigns yet.</p>
          </Panel>
        ) : (
          <ul className="space-y-3.5">
            {paginatedLaunchedEntries.map(({ campaign: c, myApplication }) => (
              <li key={c.id}>
                <Link
                  href={`/creator/campaigns/${c.id}`}
                  className={`group block ${CREATOR_CAMPAIGN_CARD_CLASS} hover:border-[#a855f7]/45`}
                  style={{ borderTopWidth: '2px', borderTopColor: '#bffcff' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">{c.title}</span>
                        <span className="rounded border border-[#a855f7]/35 bg-[#a855f7]/20 px-2 py-0.5 text-xs text-[#d8b4fe]">Launched</span>
                        {myApplication && (
                          <span className={`text-xs px-2 py-0.5 rounded ${APPLICATION_STATUS_STYLES[myApplication.status] ?? ''}`}>
                            {APPLICATION_STATUS_LABELS[myApplication.status] ?? myApplication.status}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[#a9abb5]">
                        {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                        {c.platform.join(', ')}
                        {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
                      </p>
                      {c.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-[#e8f4ff]">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.game_category.slice(0, 3).map((g: string) => (
                          <span key={g} className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]">{g}</span>
                        ))}
                        {c.content_type.slice(0, 2).map((t: string) => (
                          <span key={t} className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.budget != null && (() => {
                        const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                        return (
                          <>
                            <span className="text-sm font-bold cr-success">${creatorPool.toLocaleString()}</span>
                            <p className="text-[10px] text-[#a9abb5]">creator pool</p>
                          </>
                        )
                      })()}
                      <p className="mt-0.5 text-xs text-[#a9abb5]">{c._count.applications} creators</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}

    </main>
    </CreatorRouteShell>
  )
}
