import Link from 'next/link'
import { getOpenCampaignsWithEligibility, getLaunchedCampaigns, getCreatorOAuthStatus, getMyInvitations } from './_actions'
import Panel from '@/components/shared/Panel'
import InviteResponseButtons from '@/components/creator/InviteResponseButtons'
import { calcFeeBreakdown } from '@/lib/constants'

const APPLICATION_STATUS_STYLES: Record<string, string> = {
  accepted: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  rejected: 'bg-[#94a3b8]/20 text-[#94a3b8]',
}

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepted',
  pending: 'Applied',
  rejected: 'Not selected',
}

export default async function CreatorCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { verified } = await getCreatorOAuthStatus()

  if (!verified) {
    return (
      <main className="max-w-4xl mx-auto p-6 sm:p-8">
        <div className="mb-6">
          <Link href="/creator" className="text-xs cr-accent hover:underline">← Back to Dashboard</Link>
          <h1 className="text-xl font-semibold cr-text-bright mt-2">Open Campaigns</h1>
        </div>
        <Panel variant="creator">
          <div className="text-center py-10 px-4">
            <p className="text-base font-semibold cr-text-bright mb-2">Connect a platform to view campaigns</p>
            <p className="text-sm cr-text-muted mb-6">
              You need to connect at least one verified platform — Twitch or YouTube — before you can browse sponsor campaigns.
            </p>
            <Link
              href="/creator/profile"
              className="inline-block text-sm font-medium px-4 py-2 rounded-md bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/30 hover:bg-[#00c8ff]/20 transition-colors"
            >
              Go to Profile Settings
            </Link>
          </div>
        </Panel>
      </main>
    )
  }

  const { tab } = await searchParams
  const activeTab = tab === 'launched' ? 'launched' : tab === 'invites' ? 'invites' : 'open'

  const [allEntries, launchedEntries, invitations] = await Promise.all([
    activeTab === 'open' ? getOpenCampaignsWithEligibility(50) : Promise.resolve([]),
    activeTab === 'launched' ? getLaunchedCampaigns(50) : Promise.resolve([]),
    activeTab === 'invites' ? getMyInvitations() : Promise.resolve([]),
  ])

  const openEntries = allEntries.filter((e) => e.eligible).sort((a, b) => b.score - a.score)

  return (
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-6">
        <Link href="/creator" className="text-xs cr-accent hover:underline">← Back to Dashboard</Link>
        <h1 className="text-xl font-semibold cr-text-bright mt-2">Campaigns</h1>
        <p className="text-sm cr-text-muted mt-1">Browse and apply to sponsor campaigns.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/10">
        <Link
          href="/creator/campaigns"
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'open'
              ? 'cr-text-bright border-b-2 border-[#00c8ff] -mb-px'
              : 'cr-text-muted hover:cr-text-bright'
          }`}
        >
          Open
        </Link>
        <Link
          href="/creator/campaigns?tab=invites"
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'invites'
              ? 'text-[#00c8ff] border-b-2 border-[#00c8ff] -mb-px'
              : 'cr-text-muted hover:cr-text-bright'
          }`}
        >
          Invites
        </Link>
        <Link
          href="/creator/campaigns?tab=launched"
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'launched'
              ? 'text-[#a855f7] border-b-2 border-[#a855f7] -mb-px'
              : 'cr-text-muted hover:cr-text-bright'
          }`}
        >
          Launched
        </Link>
      </div>

      {activeTab === 'invites' ? (
        invitations.length === 0 ? (
          <Panel variant="creator">
            <p className="text-sm cr-text-muted text-center py-8">No pending invitations.</p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {invitations.map((app) => {
              const c = app.campaign
              return (
                <li key={app.id} className="p-4 rounded-lg cr-border border cr-bg-inner">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold cr-text-bright">{c.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/20">
                          Invited
                        </span>
                      </div>
                      <p className="text-xs cr-text-muted mt-0.5">
                        {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                        {c.platform.join(', ')}
                        {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
                      </p>
                      {c.description && (
                        <p className="text-xs cr-text mt-1 line-clamp-2">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.game_category.slice(0, 3).map((g: string) => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{g}</span>
                        ))}
                        {c.content_type.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]">{t}</span>
                        ))}
                      </div>
                      <Link
                        href={`/creator/campaigns/${c.id}`}
                        className="text-xs cr-accent hover:underline mt-2 inline-block"
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
                            <p className="text-[10px] cr-text-muted">creator pool</p>
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
          <Panel variant="creator">
            <p className="text-sm cr-text-muted text-center py-8">No open campaigns right now. Check back soon!</p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {openEntries.map(({ campaign: c, score }) => (
              <li key={c.id}>
                <Link
                  href={`/creator/campaigns/${c.id}`}
                  className="block p-4 rounded-lg cr-border border cr-bg-inner hover:border-[rgba(0,200,255,0.3)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold cr-text-bright">{c.title}</span>
                      <p className="text-xs cr-text-muted mt-0.5">
                        {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                        {c.platform.join(', ')}
                        {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
                      </p>
                      {c.description && (
                        <p className="text-xs cr-text mt-1 line-clamp-2">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.game_category.slice(0, 3).map((g: string) => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{g}</span>
                        ))}
                        {c.content_type.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.budget != null && (() => {
                        const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                        return (
                          <>
                            <span className="text-sm font-bold cr-success">${creatorPool.toLocaleString()}</span>
                            <p className="text-[10px] cr-text-muted">creator pool</p>
                          </>
                        )
                      })()}
                      <p className="text-xs cr-text-muted mt-0.5">{c._count.applications} applied</p>
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
          <Panel variant="creator">
            <p className="text-sm cr-text-muted text-center py-8">No launched campaigns yet.</p>
          </Panel>
        ) : (
          <ul className="space-y-3">
            {launchedEntries.map(({ campaign: c, myApplication }) => (
              <li key={c.id}>
                <Link
                  href={`/creator/campaigns/${c.id}`}
                  className="block p-4 rounded-lg border border-[#a855f7]/20 cr-bg-inner hover:border-[#a855f7]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold cr-text-bright">{c.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">Launched</span>
                        {myApplication && (
                          <span className={`text-xs px-2 py-0.5 rounded ${APPLICATION_STATUS_STYLES[myApplication.status] ?? ''}`}>
                            {APPLICATION_STATUS_LABELS[myApplication.status] ?? myApplication.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs cr-text-muted mt-0.5">
                        {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                        {c.platform.join(', ')}
                        {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
                      </p>
                      {c.description && (
                        <p className="text-xs cr-text mt-1 line-clamp-2">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.game_category.slice(0, 3).map((g: string) => (
                          <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{g}</span>
                        ))}
                        {c.content_type.slice(0, 2).map((t: string) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.budget != null && (() => {
                        const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                        return (
                          <>
                            <span className="text-sm font-bold cr-success">${creatorPool.toLocaleString()}</span>
                            <p className="text-[10px] cr-text-muted">creator pool</p>
                          </>
                        )
                      })()}
                      <p className="text-xs cr-text-muted mt-0.5">{c._count.applications} creators</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </main>
  )
}
