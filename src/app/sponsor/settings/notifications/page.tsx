/**
 * Sponsor Notification Preferences page — /sponsor/settings/notifications
 *
 * Renders notification preference toggles for all sponsor-specific notification
 * types defined in `SPONSOR_NOTIFICATION_TYPES`. Each entry has a label (from
 * `NOTIFICATION_LABELS`) and a human-readable description defined locally in
 * `DESCRIPTIONS`.
 *
 * The actual preference form is handled by the shared `NotificationPreferencesForm`
 * component which manages loading/saving preferences server-side.
 *
 * Notification types covered:
 * - `payment_success`  — campaign payment confirmed, campaign goes live.
 * - `payment_failed`   — payment attempt failed.
 * - `creator_applied`  — a creator applied to one of the sponsor's campaigns.
 * - `system`           — platform announcements and system updates.
 *
 * Note: Types not listed in `DESCRIPTIONS` will show an empty string for their
 * description. New notification types should be added to `DESCRIPTIONS` here.
 *
 * No auth check here — the parent layout (SponsorLayout) handles the redirect guard.
 */
import SponsorHeader from '../../SponsorHeader'
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { SPONSOR_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'
import BackLink from '@/components/shared/BackLink'

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
      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        <BackLink href="/sponsor">← Back to Dashboard</BackLink>
        <h1 className="text-xl font-bold cr-text-bright mt-4 mb-1">Notification Preferences</h1>
        <p className="text-sm cr-text-muted mb-6">Choose how you want to be notified for each event type.</p>
        <NotificationPreferencesForm entries={ENTRIES} />
      </main>
    </>
  )
}
