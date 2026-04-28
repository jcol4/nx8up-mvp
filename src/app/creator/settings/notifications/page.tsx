/**
 * Creator Notification Preferences page
 * (`/creator/settings/notifications`).
 *
 * Server component that renders a per-notification-type preferences form for
 * creators. Each notification type is shown with a label and a human-readable
 * description of when it fires.
 *
 * The `ENTRIES` array is built from `CREATOR_NOTIFICATION_TYPES` (the set of
 * notification type keys relevant to creators) combined with labels from
 * `NOTIFICATION_LABELS` and descriptions from the local `DESCRIPTIONS` map.
 *
 * The actual preference toggles and persistence are handled by
 * `NotificationPreferencesForm` (a shared component).
 *
 * Auth: the role is read from Clerk `sessionClaims` and passed to
 * `UserProfileBlock` for the role badge, but no role guard is applied here
 * (the layout already enforces creator/admin access).
 *
 * External services: Clerk (auth + `getUserDisplayInfo`).
 */
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import { auth } from '@clerk/nextjs/server'
import { CREATOR_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'
import CreatorRouteShell from '@/components/creator/CreatorRouteShell'

const DESCRIPTIONS: Record<string, string> = {
  campaign_launched:    'When a campaign you were accepted to officially launches.',
  direct_invite:        'When a sponsor personally invites you to their campaign.',
  application_accepted: 'When a sponsor accepts your application to a campaign.',
  application_rejected: 'When a sponsor declines your application.',
  submission_approved:  'When a sponsor approves your submitted content.',
  submission_revision:  'When a sponsor requests changes to your submission.',
  admin_verified:       'When an admin verifies your submitted content.',
  admin_rejected:       'When an admin rejects your submitted content.',
  payout_sent:          'When a payout has been sent to your bank account.',
  payout_failed:        'When a payout fails and requires attention.',
  level_up:             'When you reach a new XP level.',
  system:               'Platform announcements and system updates.',
}

const ENTRIES = CREATOR_NOTIFICATION_TYPES.map((type) => ({
  type,
  label: NOTIFICATION_LABELS[type],
  description: DESCRIPTIONS[type] ?? '',
}))

export default async function CreatorNotificationPreferencesPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { displayName, username } = await getUserDisplayInfo()

  return (
    <CreatorRouteShell displayName={displayName} username={username} role={role}>
      <main className="mx-auto max-w-4xl p-6 sm:p-8">
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Settings</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Notification Preferences</h1>
          <p className="mt-1 text-sm text-[#a9abb5]">Choose how you want to be notified for each event type.</p>
          <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-[11px] text-[#99f7ff]">
            {ENTRIES.length} notification types
          </div>
        </div>
        <NotificationPreferencesForm entries={ENTRIES} />
      </main>
    </CreatorRouteShell>
  )
}
