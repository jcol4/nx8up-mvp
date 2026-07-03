import { auth } from '@clerk/nextjs/server'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { getSponsorMyCampaignsPreviewCached } from '@/lib/sponsor-dashboard-cache'
import { DashboardPanel } from '@/components/dashboard'

const STATUS_KEY: Record<string, string> = {
  draft: 'draft',
  pending_approval: 'pendingApproval',
  live: 'live',
  completed: 'completed',
  cancelled: 'cancelled',
  paused: 'paused',
  launched: 'launched',
}

export default async function SponsorMyCampaignsSection() {
  const { userId } = await auth()
  if (!userId) {
    return null
  }

  const t = await getTranslations('sponsor.dashboard')
  const tStatus = await getTranslations('sponsor.status')
  const format = await getFormatter()

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })

  if (!sponsor) {
    return null
  }

  const campaigns = await getSponsorMyCampaignsPreviewCached(sponsor.id)

  return (
    <DashboardPanel title={t('myCampaigns')} href="/sponsor/campaigns" linkLabel={t('viewAll')}>
      {campaigns.length === 0 ? (
        <div className="dash-bg-inner dash-border border rounded-lg p-4 text-sm text-white/90">
          <p className="mb-2">{t('emptyCampaigns')}</p>
          <Link href="/sponsor/campaigns/new" className="dash-accent hover:underline">
            {t('emptyCampaignsCta')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href="/sponsor/campaigns"
              className="block p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#99f7ff]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium dash-text-bright">{c.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    c.status === 'live'
                      ? 'bg-[#22c55e]/20 text-[#22c55e]'
                      : c.status === 'pending_approval'
                        ? 'bg-[#eab308]/20 text-[#eab308]'
                        : c.status === 'completed'
                          ? 'bg-[#00c8ff]/20 text-[#00c8ff]'
                          : c.status === 'cancelled'
                            ? 'bg-[#f87171]/20 text-[#f87171]'
                            : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                  }`}
                >
                  {STATUS_KEY[c.status] ? tStatus(STATUS_KEY[c.status]) : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/80">
                {(c.game_category?.length ? c.game_category.join(' · ') : t('gamingFallback'))}{' '}
                {c.budget != null && `· $${format.number(c.budget)}`}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs dash-accent">
                  {c._count.applications > 0
                    ? t('applicantCount', { n: c._count.applications })
                    : t('noApplicants')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
