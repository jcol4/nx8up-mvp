import SponsorHeader from '../../_components/dashboard/SponsorHeader'
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { SPONSOR_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'

const DESCRIPTIONS: Record<string, string> = {
  payment_success: 'When a campaign payment is confirmed and the campaign goes live.',
  payment_failed: 'When a payment attempt fails and needs to be retried.',
  creator_applied: 'When a creator applies to one of your campaigns.',
  system: 'Platform announcements and system updates.',
}

const ENTRIES = SPONSOR_NOTIFICATION_TYPES.map((type) => ({
  type,
  label: NOTIFICATION_LABELS[type],
  description: DESCRIPTIONS[type] ?? '',
}))

export default function SponsorNotificationPreferencesPage() {
  return (
    <>
      <SponsorHeader />
      <main className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-settings sponsor-settings-detail mx-auto max-w-4xl">
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">Settings</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">
              Notification Preferences
            </h1>
            <p className="mt-1 text-sm leading-relaxed cr-text-muted">
              Choose how you want to be notified for each event type.
            </p>
            <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-nx-11 text-[#99f7ff]">
              {ENTRIES.length} notification type{ENTRIES.length === 1 ? '' : 's'}
            </div>
          </div>
          <NotificationPreferencesForm entries={ENTRIES} />
        </div>
      </main>
    </>
  )
}
