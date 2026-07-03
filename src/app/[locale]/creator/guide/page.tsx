import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import CreatorShell from '@/components/creator/CreatorShell'
import GuideContent from './GuideContent'

export default async function CreatorGuidePage() {
  const t = await getTranslations('creator.guide')
  return (
    <CreatorShell>
      <div className="creator-guide creator-guide-detail mx-auto max-w-5xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('title')}</h1>
            <p className="mt-1 text-sm leading-relaxed cr-text-muted">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href="/creator"
            className="shrink-0 text-sm cr-text-muted transition-colors hover:text-[#99f7ff]"
          >
            {t('backToDashboard')}
          </Link>
        </div>

        <GuideContent />
      </div>
    </CreatorShell>
  )
}
