import { getTranslations } from 'next-intl/server'
import SponsorHeader from '../../_components/dashboard/SponsorHeader'
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { SPONSOR_NOTIFICATION_TYPES } from '@/lib/notification-types'

const DESCRIPTION_KEYS: Record<string, string> = {
  payment_success: 'descPaymentSuccess',
  payment_failed: 'descPaymentFailed',
  creator_applied: 'descCreatorApplied',
  system: 'descSystem',
}

export default async function SponsorNotificationPreferencesPage() {
  const t = await getTranslations('sponsor.settings')
  const tEnum = await getTranslations('enums')
  const ENTRIES = SPONSOR_NOTIFICATION_TYPES.map((type) => ({
    type,
    label: tEnum(`notificationLabel.${type}`),
    description: DESCRIPTION_KEYS[type] ? t(DESCRIPTION_KEYS[type]) : '',
  }))

  return (
    <>
      <SponsorHeader />
      <main className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-settings sponsor-settings-detail mx-auto max-w-4xl">
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">
              {t('notificationsTitle')}
            </h1>
            <p className="mt-1 text-sm leading-relaxed cr-text-muted">
              {t('notificationsSubtitle')}
            </p>
            <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-nx-11 text-[#99f7ff]">
              {t('notificationsCount', { n: ENTRIES.length })}
            </div>
          </div>
          <NotificationPreferencesForm entries={ENTRIES} />
        </div>
      </main>
    </>
  )
}
