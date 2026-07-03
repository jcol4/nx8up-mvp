import { auth } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { DashboardPanel } from '@/components/dashboard'
import { prisma } from '@/lib/prisma'
import { getSponsorMatchedCreatorsPreviewCached } from '@/lib/sponsor-dashboard-cache'

export default async function SponsorMatchedCreatorsSection() {
  const t = await getTranslations('sponsor.dashboard')
  const { userId } = await auth()
  if (!userId) {
    return (
      <DashboardPanel title={t('matchedCreators')} href="/sponsor/creators" linkLabel={t('browseAll')}>
        <p className="text-sm text-white/90">{t('signInMatches')}</p>
      </DashboardPanel>
    )
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })

  if (!sponsor?.id) {
    return (
      <DashboardPanel title={t('matchedCreators')} href="/sponsor/creators" linkLabel={t('browseAll')}>
        <p className="text-sm text-white/90">{t('completeSetupMatches')}</p>
      </DashboardPanel>
    )
  }

  const { hasBaseCampaign, topMatches } = await getSponsorMatchedCreatorsPreviewCached(sponsor.id)

  if (!hasBaseCampaign) {
    return (
      <DashboardPanel title={t('matchedCreators')} href="/sponsor/creators" linkLabel={t('browseAll')}>
        <p className="mb-2 text-sm text-white/90">{t('postToUnlock')}</p>
        <Link href="/sponsor/campaigns/new" className="text-xs dash-accent hover:underline">
          {t('createCampaign')}
        </Link>
      </DashboardPanel>
    )
  }

  return (
    <DashboardPanel title={t('matchedCreators')} href="/sponsor/creators" linkLabel={t('browseAll')}>
      <p className="mb-3 text-sm text-white/90">{t('matchedDesc')}</p>
      {topMatches.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-center text-sm text-white/85">
          {t('noMatches')}
        </div>
      ) : (
        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
          {topMatches.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="block p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#99f7ff]/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 text-xs font-semibold text-[#99f7ff]">
                    {c.username.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium dash-text-bright">{c.username}</span>
                    <p className="mt-0.5 truncate text-xs text-white/80">
                      {c.categories.join(' · ')} · {c.followers}
                    </p>
                  </div>
                </div>
                <span className="text-xs dash-accent font-semibold">{t('matchPct', { n: c.matchScore })}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#99f7ff] to-[#d873ff]"
                  style={{ width: `${c.matchScore}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
