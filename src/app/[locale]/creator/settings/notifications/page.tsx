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
import { getTranslations } from 'next-intl/server'
import { CREATOR_NOTIFICATION_TYPES } from '@/lib/notification-types'
import CreatorShell from '@/components/creator/CreatorShell'

const DESCRIPTION_KEYS: Record<string, string> = {
  campaign_launched:    'descCampaignLaunched',
  direct_invite:        'descDirectInvite',
  application_accepted: 'descApplicationAccepted',
  application_rejected: 'descApplicationRejected',
  submission_approved:  'descSubmissionApproved',
  submission_revision:  'descSubmissionRevision',
  admin_verified:       'descAdminVerified',
  admin_rejected:       'descAdminRejected',
  payout_sent:          'descPayoutSent',
  payout_failed:        'descPayoutFailed',
  level_up:             'descLevelUp',
  system:               'descSystem',
}

export default async function CreatorNotificationPreferencesPage() {
  const t = await getTranslations('creator.settings')
  const tEnum = await getTranslations('enums')
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { displayName, username } = await getUserDisplayInfo()

  const ENTRIES = CREATOR_NOTIFICATION_TYPES.map((type) => ({
    type,
    label: tEnum(`notificationLabel.${type}`),
    description: DESCRIPTION_KEYS[type] ? t(DESCRIPTION_KEYS[type]) : '',
  }))

  return (
    <CreatorShell>
      <main className="creator-settings creator-settings-detail mx-auto max-w-4xl p-6 sm:p-8">
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('notificationsTitle')}</h1>
          <p className="mt-1 text-sm leading-relaxed cr-text-muted">{t('notificationsSubtitle')}</p>
          <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-nx-11 text-[#99f7ff]">
            {t('notificationsCount', { n: ENTRIES.length })}
          </div>
        </div>
        <NotificationPreferencesForm entries={ENTRIES} />
      </main>
    </CreatorShell>
  )
}
