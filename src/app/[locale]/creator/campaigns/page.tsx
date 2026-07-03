/**
 * Creator Campaigns listing page (`/creator/campaigns`).
 */
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getCreatorOAuthStatus } from './_actions'
import Panel from '@/components/shared/Panel'
import CreatorShell from '@/components/creator/CreatorShell'
import CreatorCampaignsList from './CreatorCampaignsList'
import CreatorCampaignsListSkeleton from './CreatorCampaignsListSkeleton'

export default async function CreatorCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; filter?: string }>
}) {
  const { verified, stripeReady } = await getCreatorOAuthStatus()
  const t = await getTranslations('creator.campaigns')

  if (!stripeReady) {
    return (
      <CreatorShell>
        <main className="creator-campaigns max-w-4xl mx-auto p-6 sm:p-8">
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('openCampaignsHeading')}</h1>
          </div>
          <Panel variant="creator" className="dash-panel dash-panel--nx-top rounded-xl p-0">
            <div className="text-center py-10 px-4">
              <p className="mb-2 text-base font-semibold text-[#e8f4ff]">{t('noPayoutHeading')}</p>
              <p className="mb-6 text-sm cr-text-muted">
                {t('noPayoutDesc')}
              </p>
              <Link
                href="/creator/profile"
                className="inline-block rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-300 transition-colors hover:bg-yellow-500/20"
              >
                {t('noPayoutBtn')}
              </Link>
            </div>
          </Panel>
        </main>
      </CreatorShell>
    )
  }

  if (!verified) {
    return (
      <CreatorShell>
        <main className="creator-campaigns max-w-4xl mx-auto p-6 sm:p-8">
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('openCampaignsHeading')}</h1>
          </div>
          <Panel variant="creator" className="dash-panel dash-panel--nx-top rounded-xl p-0">
            <div className="text-center py-10 px-4">
              <p className="mb-2 text-base font-semibold text-[#e8f4ff]">{t('noPlatformHeading')}</p>
              <p className="mb-6 text-sm cr-text-muted">
                {t('noPlatformDesc')}
              </p>
              <Link
                href="/creator/profile"
                className="inline-block rounded-md border border-[#99f7ff]/35 bg-[#99f7ff]/12 px-4 py-2 text-sm font-medium text-[#99f7ff] transition-colors hover:bg-[#99f7ff]/18"
              >
                {t('noPlatformBtn')}
              </Link>
            </div>
          </Panel>
        </main>
      </CreatorShell>
    )
  }

  const { tab } = await searchParams
  const activeTab = tab === 'active' ? 'active' : tab === 'invites' ? 'invites' : 'open'

  return (
    <CreatorShell>
      <main className="creator-campaigns max-w-4xl mx-auto p-6 sm:p-8">
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('title')}</h1>
          <p className="mt-1 text-sm cr-text-muted">{t('subtitle')}</p>
        </div>

        <div className="mb-5 flex gap-1 border-b border-white/10">
          <Link
            href="/creator/campaigns"
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'open'
                ? 'text-[#e8f4ff] border-b-2 border-[#99f7ff] -mb-px'
                : 'cr-text-muted hover:text-[#e8f4ff]'
            }`}
          >
            {t('tabOpen')}
          </Link>
          <Link
            href="/creator/campaigns?tab=invites"
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'invites'
                ? 'text-[#99f7ff] border-b-2 border-[#99f7ff] -mb-px'
                : 'cr-text-muted hover:text-[#e8f4ff]'
            }`}
          >
            {t('tabInvites')}
          </Link>
          <Link
            href="/creator/campaigns?tab=active"
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'active'
                ? 'text-[#a855f7] border-b-2 border-[#a855f7] -mb-px'
                : 'cr-text-muted hover:text-[#e8f4ff]'
            }`}
          >
            {t('tabActive')}
          </Link>
        </div>

        <Suspense fallback={<CreatorCampaignsListSkeleton />}>
          <CreatorCampaignsList searchParams={searchParams} />
        </Suspense>
      </main>
    </CreatorShell>
  )
}
