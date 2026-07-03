import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import SponsorGuideContent from './GuideContent'

export default async function SponsorGuidePage() {
  const t = await getTranslations('sponsor.guide')
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-guide sponsor-guide-detail mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('title')}</h1>
              <p className="mt-1 text-sm leading-relaxed cr-text-muted">
                {t('subtitle')}
              </p>
            </div>
            <Link
              href="/sponsor"
              className="shrink-0 text-sm cr-text-muted transition-colors hover:text-[#99f7ff]"
            >
              {t('backToDashboard')}
            </Link>
          </div>

          <SponsorGuideContent />
        </div>
      </div>
    </>
  )
}
