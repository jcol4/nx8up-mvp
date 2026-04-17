import CreatorTopBar from '@/components/creator/CreatorTopBar'
import NotificationBell from '@/components/shared/NotificationBell'
import UserProfileBlock from '@/components/shared/UserProfileBlock'
import NotificationPreferencesForm from '@/components/shared/NotificationPreferencesForm'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import { auth } from '@clerk/nextjs/server'
import { CREATOR_NOTIFICATION_TYPES, NOTIFICATION_LABELS } from '@/lib/notification-types'
import BackLink from '@/components/shared/BackLink'

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
    <>
      <CreatorTopBar
        rightContent={
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell />
            <UserProfileBlock
              displayName={displayName}
              username={username}
              variant="creator"
              editProfileLink="/creator/profile"
              role={role}
            />
          </div>
        }
      />
      <main className="max-w-2xl mx-auto p-6 sm:p-8">
        <BackLink href="/creator">← Back to Dashboard</BackLink>
        <h1 className="text-xl font-bold cr-text-bright mt-4 mb-1">Notification Preferences</h1>
        <p className="text-sm cr-text-muted mb-6">Choose how you want to be notified for each event type.</p>
        <NotificationPreferencesForm entries={ENTRIES} />
      </main>
    </>
  )
}
