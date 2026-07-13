import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderNotification, roleForType, notify, type NotificationEvent } from '../notification-events'
import {
  CREATOR_NOTIFICATION_TYPES,
  SPONSOR_NOTIFICATION_TYPES,
  ADMIN_NOTIFICATION_TYPES,
  type NotificationType,
} from '../notification-types'

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(async () => ({ id: 'notif_1' })),
}))
import { createNotification } from '@/lib/notifications'

// ─── Role derivation ─────────────────────────────────────────────────────────

describe('roleForType — role is a function of type', () => {
  it('resolves each single-feed type to its owning dashboard', () => {
    expect(roleForType('payout_sent')).toBe('creator')
    expect(roleForType('payment_success')).toBe('sponsor')
    expect(roleForType('dispute_created')).toBe('admin')
  })

  it('throws for the role-ambiguous "system" type rather than guessing', () => {
    expect(() => roleForType('system')).toThrow(/system/)
  })

  it('no non-system type belongs to more than one feed (derivation is unambiguous)', () => {
    const counts = new Map<NotificationType, number>()
    for (const t of [
      ...CREATOR_NOTIFICATION_TYPES,
      ...SPONSOR_NOTIFICATION_TYPES,
      ...ADMIN_NOTIFICATION_TYPES,
    ]) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    const shared = [...counts.entries()].filter(([t, n]) => n > 1 && t !== 'system')
    expect(shared).toEqual([])
  })
})

// ─── renderNotification: role always agrees with type ────────────────────────

describe('renderNotification — the role can never disagree with the type', () => {
  // A representative event of every union variant, both branches where a bool splits it.
  const samples: NotificationEvent[] = [
    { type: 'payout_sent', userId: 'u', campaignTitle: 'C', transferId: 't1' },
    { type: 'payout_failed', userId: 'u' },
    { type: 'campaign_live', userId: 'u', campaignTitle: 'C' },
    { type: 'direct_invite', userId: 'u', campaignTitle: 'C' },
    { type: 'application_decided', userId: 'u', campaignTitle: 'C', accepted: true },
    { type: 'application_decided', userId: 'u', campaignTitle: 'C', accepted: false },
    { type: 'submission_reviewed', userId: 'u', campaignTitle: 'C', approved: true },
    { type: 'submission_reviewed', userId: 'u', campaignTitle: 'C', approved: false },
    { type: 'admin_submission_verdict', userId: 'u', campaignTitle: 'C', verified: true },
    { type: 'admin_submission_verdict', userId: 'u', campaignTitle: 'C', verified: false },
    { type: 'campaign_cancelled', userId: 'u', campaignTitle: 'C' },
    { type: 'opt_out_verdict', userId: 'u', campaignTitle: 'C', approved: true },
    { type: 'opt_out_verdict', userId: 'u', campaignTitle: 'C', approved: false, scoreDelta: -5 },
    { type: 'level_up', userId: 'u', level: 3, rankName: 'Gold' },
    { type: 'payment_confirmed', userId: 'u', campaignTitle: 'C', paymentIntentId: 'pi_1' },
    { type: 'payment_failed', userId: 'u', campaignTitle: 'C' },
    { type: 'creator_applied', userId: 'u', campaignId: 'c1', campaignTitle: 'C', viaInvite: false },
    { type: 'creator_applied', userId: 'u', campaignId: 'c1', campaignTitle: 'C', viaInvite: true },
    { type: 'launch_verdict', userId: 'u', campaignTitle: 'C', approved: true },
    { type: 'launch_verdict', userId: 'u', campaignTitle: 'C', approved: false },
    { type: 'refund_verdict', userId: 'u', campaignTitle: 'C', verdict: 'valid', scoreDelta: 0 },
    { type: 'dispute_created', userId: 'u', amountLabel: '$5', reason: 'fraudulent', dueBy: new Date('2026-01-01'), disputeId: 'd1', stripeDisputeId: 'dp_1' },
  ]

  it('every event renders a non-empty title/message and a userId', () => {
    for (const ev of samples) {
      const n = renderNotification(ev)
      expect(n.userId).toBe('u')
      expect(n.title.length).toBeGreaterThan(0)
      expect(n.message.length).toBeGreaterThan(0)
    }
  })

  it('the derived role matches the resolved type for every variant', () => {
    for (const ev of samples) {
      const n = renderNotification(ev)
      expect(n.role).toBe(roleForType(n.type))
    }
  })
})

// ─── Wording / link / dedupe fidelity per event ──────────────────────────────

describe('renderNotification — creator-facing events', () => {
  it('payout_sent: creator feed, campaign in message, deduped on the transfer id', () => {
    const n = renderNotification({ type: 'payout_sent', userId: 'u', campaignTitle: 'Neon Blitz', transferId: 'tr_9' })
    expect(n.role).toBe('creator')
    expect(n.type).toBe('payout_sent')
    expect(n.title).toBe('Payout sent')
    expect(n.message).toContain('Neon Blitz')
    expect(n.link).toBe('/creator/campaigns')
    expect(n.dedupeKey).toBe('tr_9')
  })

  it('application_decided branches title/message/type on accepted', () => {
    const yes = renderNotification({ type: 'application_decided', userId: 'u', campaignTitle: 'C', accepted: true })
    const no = renderNotification({ type: 'application_decided', userId: 'u', campaignTitle: 'C', accepted: false })
    expect(yes.type).toBe('application_accepted')
    expect(yes.title).toBe('Application accepted!')
    expect(no.type).toBe('application_rejected')
    expect(no.title).toBe('Application update')
    expect(no.message).not.toBe(yes.message)
  })

  it('submission_reviewed appends the sponsor note only on revision requests', () => {
    const approved = renderNotification({ type: 'submission_reviewed', userId: 'u', campaignTitle: 'C', approved: true, sponsorNotes: 'ignored' })
    const revision = renderNotification({ type: 'submission_reviewed', userId: 'u', campaignTitle: 'C', approved: false, sponsorNotes: 'fix the audio' })
    expect(approved.message).not.toContain('ignored')
    expect(revision.message).toContain('Note: fix the audio')
  })

  it('admin_submission_verdict appends the reason only on rejection', () => {
    const ok = renderNotification({ type: 'admin_submission_verdict', userId: 'u', campaignTitle: 'C', verified: true, notes: 'ignored' })
    const bad = renderNotification({ type: 'admin_submission_verdict', userId: 'u', campaignTitle: 'C', verified: false, notes: 'off-brand' })
    expect(ok.type).toBe('admin_verified')
    expect(ok.message).not.toContain('ignored')
    expect(bad.type).toBe('admin_rejected')
    expect(bad.message).toContain('Reason: off-brand')
  })

  it('opt_out_verdict names the score adjustment only when rejected', () => {
    const approved = renderNotification({ type: 'opt_out_verdict', userId: 'u', campaignTitle: 'C', approved: true })
    const rejected = renderNotification({ type: 'opt_out_verdict', userId: 'u', campaignTitle: 'C', approved: false, scoreDelta: -8 })
    expect(approved.title).toBe('Opt-Out Approved')
    expect(approved.message).toContain('No reputation penalty')
    expect(rejected.title).toBe('Opt-Out Rejected')
    expect(rejected.message).toContain('-8')
  })

  it('level_up puts the level in the title and the rank in the message', () => {
    const n = renderNotification({ type: 'level_up', userId: 'u', level: 7, rankName: 'Diamond' })
    expect(n.title).toBe('Level 7')
    expect(n.message).toContain('Diamond')
    expect(n.link).toBe('/creator')
  })
})

describe('renderNotification — sponsor-facing events', () => {
  it('payment_confirmed: sponsor feed, deduped on the payment intent, falls back when title missing', () => {
    const n = renderNotification({ type: 'payment_confirmed', userId: 'u', campaignTitle: null, paymentIntentId: 'pi_42' })
    expect(n.role).toBe('sponsor')
    expect(n.dedupeKey).toBe('pi_42')
    expect(n.message).toContain('campaign') // null-title fallback
  })

  it('creator_applied branches the wording and links to the campaign applications page', () => {
    const applied = renderNotification({ type: 'creator_applied', userId: 'u', campaignId: 'cmp_1', campaignTitle: 'C', viaInvite: false })
    const invited = renderNotification({ type: 'creator_applied', userId: 'u', campaignId: 'cmp_1', campaignTitle: 'C', viaInvite: true })
    expect(applied.title).toBe('New creator application')
    expect(invited.title).toBe('Creator accepted your invite')
    expect(applied.link).toBe('/sponsor/campaigns/cmp_1/applications')
    expect(invited.link).toBe('/sponsor/campaigns/cmp_1/applications')
  })

  it('launch_verdict appends the admin reason only on denial', () => {
    const ok = renderNotification({ type: 'launch_verdict', userId: 'u', campaignTitle: 'C', approved: true, adminNotes: 'ignored' })
    const denied = renderNotification({ type: 'launch_verdict', userId: 'u', campaignTitle: 'C', approved: false, adminNotes: 'missing tax info' })
    expect(ok.type).toBe('launch_approved')
    expect(ok.message).not.toContain('ignored')
    expect(denied.type).toBe('launch_denied')
    expect(denied.message).toContain('Reason: missing tax info')
  })

  it('refund_verdict states the score adjustment only when the delta is negative', () => {
    const valid = renderNotification({ type: 'refund_verdict', userId: 'u', campaignTitle: 'C', verdict: 'valid', scoreDelta: 0 })
    const invalid = renderNotification({ type: 'refund_verdict', userId: 'u', campaignTitle: 'C', verdict: 'invalid', scoreDelta: -10 })
    expect(valid.message).toContain('accepted as valid')
    expect(valid.message).not.toContain('adjusted by')
    expect(invalid.message).toContain('marked as invalid')
    expect(invalid.message).toContain('-10')
  })
})

describe('renderNotification — admin-facing events', () => {
  it('dispute_created: admin feed, humanizes the reason, deduped on the Stripe dispute id', () => {
    const n = renderNotification({
      type: 'dispute_created',
      userId: 'u',
      amountLabel: '$120.00',
      reason: 'credit_not_processed',
      dueBy: new Date('2026-02-01T00:00:00Z'),
      disputeId: 'disp_5',
      stripeDisputeId: 'dp_5',
    })
    expect(n.role).toBe('admin')
    expect(n.message).toContain('$120.00')
    expect(n.message).toContain('credit not processed') // underscores humanized
    expect(n.link).toBe('/admin/disputes/disp_5')
    expect(n.dedupeKey).toBe('dp_5')
  })
})

// ─── notify: delegation ──────────────────────────────────────────────────────

describe('notify — persists exactly what renderNotification produced', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forwards the rendered input to createNotification', async () => {
    const event: NotificationEvent = { type: 'payout_sent', userId: 'u', campaignTitle: 'C', transferId: 'tr_1' }
    await notify(event)
    expect(createNotification).toHaveBeenCalledTimes(1)
    expect(createNotification).toHaveBeenCalledWith(renderNotification(event))
  })
})
