import AdminHeader from '../../AdminHeader'
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { ADMIN_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'
import BackLink from '@/components/shared/BackLink'

const DESCRIPTIONS: Record<string, string> = {
  admin_queue: 'When a new submission is added to the admin verification queue.',
  system:      'Platform announcements and system updates.',
}

const ENTRIES = ADMIN_NOTIFICATION_TYPES.map((type) => ({
  type,
  label: NOTIFICATION_LABELS[type],
  description: DESCRIPTIONS[type] ?? '',
}))

export default function AdminNotificationPreferencesPage() {
  return (
    <>
      <AdminHeader />
      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        <BackLink href="/admin">← Back to Dashboard</BackLink>
        <h1 className="text-xl font-bold cr-text-bright mt-4 mb-1">Notification Preferences</h1>
        <p className="text-sm cr-text-muted mb-6">Choose how you want to be notified for each event type.</p>
        <NotificationPreferencesForm entries={ENTRIES} />
      </main>
    </>
  )
}
