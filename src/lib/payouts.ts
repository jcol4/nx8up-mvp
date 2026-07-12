/**
 * Creator payouts — moving the platform's held funds to a creator's Stripe Connect
 * account for an approved deal submission, and recording the consequences.
 *
 * Two nested modules:
 *  - `settleCreatorPayout` — the idempotent "this submission became paid" transition.
 *    Owns the PAYOUT_SENT notification and the reputation deltas. Called both
 *    synchronously (right after a transfer) and from the `transfer.created` webhook.
 *  - `initiateCreatorPayout` — the money movement: guards, atomic claim, Stripe
 *    transfer, then settle. Called only by authorized sponsor-facing adapters.
 *
 * Security invariant: this module never takes a "skip auth" flag. Callers authorize
 * the actor before calling `initiateCreatorPayout`; the trusted webhook path reaches
 * money only through `settleCreatorPayout`, which cannot move funds — only confirm a
 * transfer that already happened.
 *
 * `payout_status` moves `null → processing → paid → payout_failed`. `payout_failed`
 * is treated as terminal (no re-transfer) — see GitHub issue #6.
 */
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { calcFeeBreakdown } from '@/lib/constants'
import { notify } from '@/lib/notification-events'
import { recordReputationEvent } from '@/lib/reputation'

/**
 * Why a creator payout could not be initiated. Adapters translate these to their own
 * surface (HTTP status, action error, or a best-effort warning).
 */
export type PayoutIneligibleReason =
  | 'no_submission'           // no application/submission found for this id
  | 'not_approved'            // the deal submission is not in 'approved' state
  | 'already_failed'          // payout_status is terminal 'payout_failed' (see issue #6)
  | 'creator_not_onboarded'   // creator has no connected account / incomplete Stripe onboarding
  | 'no_budget'               // campaign has no budget
  | 'charge_unresolved'       // no settled Stripe charge could be located to fund the transfer
  | 'invalid_amount'          // per-creator amount computed as <= 0

/**
 * The result of attempting to move money for one approved deal submission. Speaks
 * *payout*, not HTTP or React — callers map it to their transport and reaction policy.
 */
export type PayoutOutcome =
  | { kind: 'paid'; transferId: string }
  | { kind: 'already_paid' }
  | { kind: 'in_progress' }
  | { kind: 'ineligible'; reason: PayoutIneligibleReason }
  | { kind: 'transfer_failed'; message: string }

/** A default, human-readable message for an ineligible payout. Adapters may override. */
export function payoutIneligibleMessage(reason: PayoutIneligibleReason): string {
  switch (reason) {
    case 'no_submission':         return 'No submission found for this application.'
    case 'not_approved':          return 'Submission is not approved.'
    case 'already_failed':        return 'A previous payout failed and cannot be retried automatically. Check the Stripe dashboard.'
    case 'creator_not_onboarded': return 'Creator has not completed Stripe payout setup.'
    case 'no_budget':             return 'Campaign has no budget.'
    case 'charge_unresolved':     return 'Could not locate a completed payment for this campaign. Check the Stripe dashboard.'
    case 'invalid_amount':        return 'Could not calculate a valid payout amount.'
  }
}

/**
 * Resolves a Stripe charge ID for a campaign.
 * Checks DB first, then falls back to Stripe API (PI retrieve → metadata search).
 * Persists a found charge ID back to the campaign row so future calls are instant.
 * Returns null if no succeeded charge can be located.
 */
async function resolveChargeId(campaign: {
  id: string
  stripe_charge_id: string | null
  stripe_payment_intent_id: string | null
}): Promise<string | null> {
  if (campaign.stripe_charge_id) return campaign.stripe_charge_id

  let chargeId: string | null = null
  let resolvedPiId: string | null = null

  // Try the stored PaymentIntent first
  if (campaign.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(campaign.stripe_payment_intent_id)
    if (pi.status === 'succeeded') {
      resolvedPiId = pi.id
      const lc = typeof pi.latest_charge === 'string'
        ? pi.latest_charge
        : (pi.latest_charge as { id: string } | null)?.id ?? null
      if (lc) chargeId = lc
    }
  }

  // Fall back to Stripe metadata search
  if (!chargeId) {
    const results = await stripe.paymentIntents.search({
      query: `metadata['campaignId']:'${campaign.id}' AND status:'succeeded'`,
      limit: 5,
    })
    const pi = results.data[0] ?? null
    if (pi) {
      resolvedPiId = pi.id
      const lc = typeof pi.latest_charge === 'string'
        ? pi.latest_charge
        : (pi.latest_charge as { id: string } | null)?.id ?? null
      if (lc) chargeId = lc
    }
  }

  // Persist so future calls hit the DB path
  if (chargeId) {
    await prisma.campaigns.update({
      where: { id: campaign.id },
      data: {
        stripe_charge_id: chargeId,
        ...(resolvedPiId ? { stripe_payment_intent_id: resolvedPiId } : {}),
      },
    })
  }

  return chargeId
}

/**
 * Idempotent "this deal submission became paid" transition (design D1, issue #7).
 *
 * Flips `payout_status → 'paid'` only if the row is still settleable (`null` or
 * `'processing'`). The count-guarded `updateMany` is atomic at the database, so the
 * consequences — the PAYOUT_SENT notification, the creator completion bonus, and the
 * sponsor full-payout rollup — fire strictly when this call *owns* the transition
 * (`count === 1`). Redeliveries and concurrent settlers see `count === 0` → 'noop'.
 * `'paid'` and `'payout_failed'` are deliberately excluded (don't re-fire; don't
 * revert a bounced payout).
 */
export async function settleCreatorPayout(
  applicationId: string,
  { transferId }: { transferId: string },
): Promise<'settled' | 'noop'> {
  const flipped = await prisma.deal_submissions.updateMany({
    where: {
      application_id: applicationId,
      OR: [{ payout_status: null }, { payout_status: 'processing' }],
    },
    data: { payout_status: 'paid', stripe_transfer_id: transferId },
  })
  if (flipped.count === 0) return 'noop'

  const app = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    select: {
      campaign_id: true,
      creator_id: true,
      campaign: { select: { title: true, sponsor_id: true } },
      creator: { select: { clerk_user_id: true } },
    },
  })
  if (!app) return 'settled'

  await notify({
    type: 'payout_sent',
    userId: app.creator.clerk_user_id,
    campaignTitle: app.campaign.title,
    transferId,
  })

  await recordReputationEvent({ type: 'deal_completed', creatorId: app.creator_id })

  // Sponsor rollup: reward once the campaign's last accepted creator is paid.
  // NOTE: still has a rare cross-creator race (two settling within the same few ms
  // could each read unpaidCount === 0). Preserved from prior behaviour; a durable
  // fix needs a campaign-level guard and belongs with the reputation-ledger work (#7).
  const unpaidCount = await prisma.deal_submissions.count({
    where: {
      payout_status: { not: 'paid' },
      application: { campaign_id: app.campaign_id, status: 'accepted' },
    },
  })
  if (unpaidCount === 0) {
    await recordReputationEvent({ type: 'campaign_fully_paid', sponsorId: app.campaign.sponsor_id })
  }

  return 'settled'
}

/**
 * Moves money for one approved deal submission: guards → atomically claims the payout
 * slot → creates the Stripe Connect transfer → settles it idempotently.
 *
 * Assumes the caller has already authorized the actor (see the security invariant in
 * the module header). Returns a domain {@link PayoutOutcome}; the caller owns transport,
 * reaction policy, and any cache revalidation.
 */
export async function initiateCreatorPayout(applicationId: string): Promise<PayoutOutcome> {
  const app = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: {
        select: {
          id: true,
          budget: true,
          creator_count: true,
          stripe_charge_id: true,
          stripe_payment_intent_id: true,
          title: true,
        },
      },
      creator: {
        select: { stripe_connect_id: true, stripe_onboarding_complete: true },
      },
      deal_submission: {
        select: { status: true, payout_status: true },
      },
    },
  })

  const sub = app?.deal_submission
  if (!app || !sub) return { kind: 'ineligible', reason: 'no_submission' }

  // Money-state guards first — these are the states from which a (re-)payout is (dis)allowed.
  if (sub.payout_status === 'paid') return { kind: 'already_paid' }
  if (sub.payout_status === 'processing') return { kind: 'in_progress' }
  if (sub.payout_status === 'payout_failed') return { kind: 'ineligible', reason: 'already_failed' }
  if (sub.status !== 'approved') return { kind: 'ineligible', reason: 'not_approved' }

  const { campaign, creator } = app
  if (!creator.stripe_connect_id || !creator.stripe_onboarding_complete) {
    return { kind: 'ineligible', reason: 'creator_not_onboarded' }
  }
  if (!campaign.budget) return { kind: 'ineligible', reason: 'no_budget' }

  const chargeId = await resolveChargeId(campaign)
  if (!chargeId) return { kind: 'ineligible', reason: 'charge_unresolved' }

  const { perCreator } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
  if (!perCreator || perCreator <= 0) return { kind: 'ineligible', reason: 'invalid_amount' }

  // Atomic race guard: claim the payout slot. Only a still-unpaid (null) row can be
  // claimed — 'processing'/'paid'/'payout_failed' are handled by the guards above.
  const claimed = await prisma.deal_submissions.updateMany({
    where: { application_id: applicationId, payout_status: null },
    data: { payout_status: 'processing' },
  })
  if (claimed.count === 0) return { kind: 'in_progress' }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: perCreator * 100,
        currency: 'usd',
        destination: creator.stripe_connect_id,
        source_transaction: chargeId,
        metadata: { applicationId, campaignId: campaign.id },
        description: `Payout for campaign: ${campaign.title}`,
      },
      { idempotencyKey: `transfer-${applicationId}` },
    )
    await settleCreatorPayout(applicationId, { transferId: transfer.id })
    console.log(`[payout] transfer ${transfer.id} sent for application ${applicationId}`)
    return { kind: 'paid', transferId: transfer.id }
  } catch (err) {
    console.error('[payout] transfer failed for application', applicationId, err)
    // Release our claim so a later retry can attempt again.
    await prisma.deal_submissions.updateMany({
      where: { application_id: applicationId, payout_status: 'processing' },
      data: { payout_status: null },
    }).catch(() => {})
    return { kind: 'transfer_failed', message: err instanceof Error ? err.message : 'Stripe transfer failed' }
  }
}
