import Image from 'next/image'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import {
  getOpenCampaignsWithEligibility,
  getActiveCampaigns,
  getMyInvitations,
} from './_actions'
import { OPEN_CAMPAIGNS_SCAN_LIMIT, CAMPAIGNS_PAGE_SIZE } from './_constants'
import Panel from '@/components/shared/Panel'
import InviteResponseButtons from '@/components/creator/InviteResponseButtons'
import OptOutButton from '@/components/creator/OptOutButton'
import { calcFeeBreakdown } from '@/lib/constants'
import { getClerkImageUrls } from '@/lib/get-clerk-images'

const APPLICATION_STATUS_STYLES: Record<string, string> = {
  accepted: 'border border-green-500/30 bg-green-500/15 text-green-300',
  pending: 'border border-yellow-500/30 bg-yellow-500/15 text-yellow-300',
  rejected: 'border border-white/12 bg-white/8 cr-text-muted',
}

const CREATOR_CAMPAIGN_CARD_CLASS =
  'dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 transition-colors'
const CREATOR_CAMPAIGN_EMPTY_CLASS =
  'dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-0'

type Props = {
  searchParams: Promise<{ tab?: string; page?: string; filter?: string }>
}

export default async function CreatorCampaignsList({ searchParams }: Props) {
  const t = await getTranslations('creator.campaigns')
  const format = await getFormatter()
  const { tab, page, filter } = await searchParams
  const activeTab = tab === 'active' ? 'active' : tab === 'invites' ? 'invites' : 'open'
  const showAll = filter === 'all'
  const pageNumber = Number(page)
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? Math.floor(pageNumber) : 1
  const pageSize = CAMPAIGNS_PAGE_SIZE

  const [allEntries, activeApps, invitations] = await Promise.all([
    activeTab === 'open' ? getOpenCampaignsWithEligibility(OPEN_CAMPAIGNS_SCAN_LIMIT) : Promise.resolve([]),
    activeTab === 'active' ? getActiveCampaigns({ all: showAll }) : Promise.resolve([]),
    activeTab === 'invites' ? getMyInvitations() : Promise.resolve([]),
  ])

  const openEntries = allEntries.filter((e) => e.eligible).sort((a, b) => b.score - a.score)
  const totalEntries =
    activeTab === 'invites' ? invitations.length : activeTab === 'open' ? openEntries.length : activeApps.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageStartLabel = totalEntries === 0 ? 0 : startIndex + 1
  const pageEndLabel = totalEntries === 0 ? 0 : Math.min(endIndex, totalEntries)
  const paginatedInvitations = invitations.slice(startIndex, endIndex)
  const paginatedOpenEntries = openEntries.slice(startIndex, endIndex)
  const paginatedActiveApps = activeApps.slice(startIndex, endIndex)

  const sponsorClerkIds = [
    ...paginatedOpenEntries.map((e) => e.campaign.sponsor.clerk_user_id),
    ...paginatedActiveApps.map((a) => a.campaign.sponsor.clerk_user_id),
    ...paginatedInvitations.map((a) => a.campaign.sponsor.clerk_user_id),
  ].filter((id): id is string => !!id)
  const sponsorImages = await getClerkImageUrls(sponsorClerkIds)

  const buildCampaignsHref = (tabValue: 'open' | 'invites' | 'active', nextPage: number, filterValue?: string) => {
    const params = new URLSearchParams()
    if (tabValue !== 'open') params.set('tab', tabValue)
    if (nextPage > 1) params.set('page', String(nextPage))
    if (filterValue) params.set('filter', filterValue)
    const query = params.toString()
    return query ? `/creator/campaigns?${query}` : '/creator/campaigns'
  }

  const now = new Date()

  const SponsorAvatar = ({ clerkUserId, name }: { clerkUserId: string | null; name: string }) => {
    const src = clerkUserId ? sponsorImages[clerkUserId] : undefined
    if (!src) return null
    return (
      <Image
        src={src}
        alt={name}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-lg object-cover border border-white/20"
        unoptimized
      />
    )
  }

  return (
    <>
      {totalEntries > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <p className="text-xs cr-text-muted">
            {pageStartLabel}-{pageEndLabel} {t('paginationOf')} {totalEntries}
            {activeTab === 'open' && allEntries.length >= OPEN_CAMPAIGNS_SCAN_LIMIT ? (
              <span className="ml-1 text-white/50">{t('paginationNote', { n: OPEN_CAMPAIGNS_SCAN_LIMIT })}</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={buildCampaignsHref(activeTab, Math.max(1, safePage - 1), showAll ? 'all' : undefined)}
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
              href={buildCampaignsHref(activeTab, Math.min(totalPages, safePage + 1), showAll ? 'all' : undefined)}
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
            <p className="py-8 text-center text-sm cr-text-muted">{t('emptyInvites')}</p>
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
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <SponsorAvatar clerkUserId={c.sponsor.clerk_user_id} name={c.sponsor.company_name ?? 'Sponsor'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-[#e8f4ff]">{c.title}</span>
                          <span className="rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]">
                            {t('invited')}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs cr-text-muted">
                          {c.sponsor.company_name ?? 'Sponsor'} · {c.platform.join(', ')}
                          {c.end_date ? ` · ${t('ends')}: ${format.dateTime(new Date(c.end_date), 'numeric')}` : ''}
                        </p>
                        {c.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-[#e8f4ff]">{c.description}</p>
                        )}
                        <Link
                          href={`/creator/campaigns/${c.id}`}
                          className="mt-2 inline-block text-xs text-[#99f7ff] hover:underline"
                        >
                          {t('viewDetails')}
                        </Link>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {c.budget != null &&
                        (() => {
                          const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                          return (
                            <div className="text-right">
                              <span className="text-sm font-bold cr-success">${format.number(creatorPool)}</span>
                              <p className="text-nx-10 cr-text-muted">{t('creatorPool')}</p>
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
            <p className="py-8 text-center text-sm cr-text-muted">No open campaigns right now. Check back soon!</p>
          </Panel>
        ) : (
          <ul className="space-y-3.5">
            {paginatedOpenEntries.map(({ campaign: c }) => (
              <li key={c.id}>
                <Link
                  href={`/creator/campaigns/${c.id}`}
                  className={`group block ${CREATOR_CAMPAIGN_CARD_CLASS} hover:border-[#99f7ff]/35`}
                  style={{ borderTopWidth: '2px', borderTopColor: '#bffcff' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <SponsorAvatar clerkUserId={c.sponsor.clerk_user_id} name={c.sponsor.company_name ?? 'Sponsor'} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">{c.title}</span>
                        <p className="mt-0.5 text-xs cr-text-muted">
                          {c.sponsor.company_name ?? 'Sponsor'} · {c.platform.join(', ')}
                          {c.end_date ? ` · ${t('ends')}: ${format.dateTime(new Date(c.end_date), 'numeric')}` : ''}
                        </p>
                        {c.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-[#e8f4ff]">{c.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.game_category.slice(0, 3).map((g: string) => (
                            <span
                              key={g}
                              className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]"
                            >
                              {g}
                            </span>
                          ))}
                          {c.content_type.slice(0, 2).map((ct: string) => (
                            <span
                              key={ct}
                              className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]"
                            >
                              {ct}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {c.budget != null &&
                        (() => {
                          const { creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
                          return (
                            <>
                              <span className="text-sm font-bold cr-success">${format.number(creatorPool)}</span>
                              <p className="text-nx-10 cr-text-muted">{t('creatorPool')}</p>
                            </>
                          )
                        })()}
                      <p className="mt-0.5 text-xs cr-text-muted">{c._count.applications} {t('applied')}</p>
                      <span className="mt-1 inline-block rounded-full border border-[#22c55e]/25 bg-[#22c55e]/10 px-2 py-0.5 text-nx-10 font-medium text-[#22c55e]">
                        {t('eligible')}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Link
              href={buildCampaignsHref('active', 1)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                !showAll
                  ? 'border-[#a855f7]/50 bg-[#a855f7]/20 text-[#d8b4fe]'
                  : 'border-white/15 cr-text-muted hover:text-[#e8f4ff]'
              }`}
            >
              {t('launchedOnly')}
            </Link>
            <Link
              href={buildCampaignsHref('active', 1, 'all')}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                showAll
                  ? 'border-[#a855f7]/50 bg-[#a855f7]/20 text-[#d8b4fe]'
                  : 'border-white/15 cr-text-muted hover:text-[#e8f4ff]'
              }`}
            >
              {t('allAccepted')}
            </Link>
          </div>

          {activeApps.length === 0 ? (
            <Panel variant="creator" className={CREATOR_CAMPAIGN_EMPTY_CLASS}>
              <p className="py-8 text-center text-sm cr-text-muted">
                {showAll ? t('emptyActive') : t('emptyLaunched')}
              </p>
            </Panel>
          ) : (
            <ul className="space-y-3.5">
              {paginatedActiveApps.map((app) => {
                const c = app.campaign
                const { perCreator, creatorPool } =
                  c.budget != null ? calcFeeBreakdown(c.budget, c.creator_count) : { perCreator: null, creatorPool: null }
                const href = c.status === 'launched' ? `/creator/deal-room/${app.id}` : `/creator/campaigns/${c.id}`
                const canOptOut = !app.opt_out && c.start_date && new Date(c.start_date) > now

                return (
                  <li key={app.id}>
                    <div className={CREATOR_CAMPAIGN_CARD_CLASS} style={{ borderTopWidth: '2px', borderTopColor: '#bffcff' }}>
                      <Link href={href} className="group block">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <SponsorAvatar
                              clerkUserId={c.sponsor.clerk_user_id}
                              name={c.sponsor.company_name ?? 'Sponsor'}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">
                                  {c.title}
                                </span>
                                <span className="rounded border border-[#22c55e]/30 bg-[#22c55e]/12 px-2 py-0.5 text-xs text-[#4ade80]">
                                  {t('accepted')}
                                </span>
                                {c.status === 'launched' && (
                                  <span className="rounded border border-[#a855f7]/35 bg-[#a855f7]/20 px-2 py-0.5 text-xs text-[#d8b4fe]">
                                    {t('launched')}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs cr-text-muted">
                                {c.sponsor.company_name ?? 'Sponsor'}
                                {c.end_date ? ` · ${t('deadline')} ${format.dateTime(new Date(c.end_date), 'numeric')}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {c.budget != null && creatorPool != null && (
                              <>
                                <span className="text-sm font-bold cr-success">
                                  ${format.number(perCreator ?? creatorPool)}
                                </span>
                                <p className="text-nx-10 cr-text-muted">{perCreator ? t('yourPayout') : t('creatorPool')}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                      {canOptOut && (
                        <div className="mt-2">
                          <OptOutButton applicationId={app.id} campaignTitle={c.title} />
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </>
  )
}
