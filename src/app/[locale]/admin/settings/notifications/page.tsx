import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { ADMIN_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'
import BackLink from '@/components/shared/BackLink'

const DESCRIPTIONS: Record<string, string> = {
  admin_queue: 'When a new submission is added to the admin verification queue.',
  system: 'Platform announcements and system updates.',
}

const ENTRIES = ADMIN_NOTIFICATION_TYPES.map((type) => ({
  type,
  label: NOTIFICATION_LABELS[type],
  description: DESCRIPTIONS[type] ?? '',
}))

export default function AdminNotificationPreferencesPage() {
  return (
    <main className="admin-settings admin-settings-detail mx-auto max-w-4xl p-6 sm:p-8">
      <BackLink
        href="/admin"
        className="mb-4 inline-block text-sm cr-text-muted transition-colors hover:text-[#99f7ff] hover:no-underline"
      >
        ← Back to Dashboard
      </BackLink>

      <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">Settings</p>
        <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Notification Preferences</h1>
        <p className="mt-1 text-sm leading-relaxed cr-text-muted">
          Choose how you want to be notified for each event type.
        </p>
        <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-nx-11 text-[#99f7ff]">
          {ENTRIES.length} notification type{ENTRIES.length === 1 ? '' : 's'}
        </div>
      </div>

      <NotificationPreferencesForm entries={ENTRIES} />
    </main>
  )
}
