import SponsorHeader from '../../_components/dashboard/SponsorHeader'
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { SPONSOR_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'

const DESCRIPTIONS: Record<string, string> = {
  payment_success: 'When a campaign payment is confirmed and the campaign goes live.',
  payment_failed:  'When a payment attempt fails and needs to be retried.',
  creator_applied: 'When a creator applies to one of your campaigns.',
  system:          'Platform announcements and system updates.',
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
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Notifications</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Notification Preferences</h1>
            <p className="mt-1 text-sm text-[#a9abb5]">Choose how you want to be notified for each event type.</p>
          </div>
          <NotificationPreferencesForm entries={ENTRIES} />
        </div>
      </main>
    </>
  )
}
