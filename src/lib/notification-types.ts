export const NOTIFICATION_TYPES = {
  // Creator
  APPLICATION_ACCEPTED:   'application_accepted',
  APPLICATION_REJECTED:   'application_rejected',
  SUBMISSION_APPROVED:    'submission_approved',
  SUBMISSION_REVISION:    'submission_revision',
  ADMIN_VERIFIED:         'admin_verified',
  ADMIN_REJECTED:         'admin_rejected',
  PAYOUT_SENT:            'payout_sent',
  PAYOUT_FAILED:          'payout_failed',
  CAMPAIGN_LAUNCHED:      'campaign_launched',
  DIRECT_INVITE:          'direct_invite',
  LEVEL_UP:               'level_up',
  MISSION_COMPLETE:       'mission_complete',
  SYSTEM:                 'system',
  // Sponsor
  PAYMENT_SUCCESS:        'payment_success',
  PAYMENT_FAILED:         'payment_failed',
  CREATOR_APPLIED:        'creator_applied',
  // Admin
  ADMIN_QUEUE:            'admin_queue',
} as const

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  campaign_launched:     'Campaign',
  direct_invite:         'Direct Invite',
  application_accepted:  'Application',
  application_rejected:  'Application',
  submission_approved:   'Submission',
  submission_revision:   'Submission',
  admin_verified:        'Verification',
  admin_rejected:        'Verification',
  payout_sent:           'Payout',
  payout_failed:         'Payout',
  level_up:              'Level Up',
  mission_complete:      'Mission',
  system:                'System',
  payment_success:       'Payment',
  payment_failed:        'Payment',
  creator_applied:       'Application',
  admin_queue:           'Queue',
}

export type NotificationRole = 'creator' | 'sponsor' | 'admin'

export const CREATOR_NOTIFICATION_TYPES: NotificationType[] = [
  'campaign_launched',
  'direct_invite',
  'application_accepted',
  'application_rejected',
  'submission_approved',
  'submission_revision',
  'admin_verified',
  'admin_rejected',
  'payout_sent',
  'payout_failed',
  'level_up',
  'system',
]

export const SPONSOR_NOTIFICATION_TYPES: NotificationType[] = [
  'payment_success',
  'payment_failed',
  'creator_applied',
  'system',
]

export const ADMIN_NOTIFICATION_TYPES: NotificationType[] = [
  'admin_queue',
  'system',
]
