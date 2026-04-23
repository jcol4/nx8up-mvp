import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'
import type Stripe from 'stripe'

type Creator = {
  email: string
  twitch_username: string | null
  youtube_channel_name: string | null
  stripe_connect_id: string | null
}

type Submission = {
  id: string
  proof_urls: string[]
  screenshot_url: string | null
  posted_at: Date | null
  submitted_at: Date | null
  disclosure_confirmed: boolean
  status: string
  admin_notes: string | null
  payout_status: string | null
  stripe_transfer_id: string | null
  updated_at: Date
  creator: Creator | null
}

type DisputeData = {
  dispute: Stripe.Dispute
  campaign: {
    id: string
    title: string
    objective: string | null
    brand_name: string | null
    product_name: string | null
    platform: string[]
    content_type: string[]
    start_date: Date | null
    end_date: Date | null
    budget: number | null
  } | null
  sponsor: {
    id: string
    company_name: string | null
    email: string
  } | null
  submissions: Submission[]
}

function resolveId(val: string | { id: string } | null | undefined): string | null {
  if (!val) return null
  return typeof val === 'string' ? val : val.id
}

export async function fetchDisputeData(stripeDispute: Stripe.Dispute): Promise<DisputeData> {
  const chargeId = resolveId(stripeDispute.charge as string | { id: string } | null)
  const piId = resolveId(stripeDispute.payment_intent as string | { id: string } | null)

  const conditions: object[] = []
  if (chargeId) conditions.push({ stripe_charge_id: chargeId })
  if (piId) conditions.push({ stripe_payment_intent_id: piId })

  const campaign = conditions.length > 0
    ? await prisma.campaigns.findFirst({
        where: { OR: conditions },
        select: {
          id: true,
          title: true,
          objective: true,
          brand_name: true,
          product_name: true,
          platform: true,
          content_type: true,
          start_date: true,
          end_date: true,
          budget: true,
          sponsor: {
            select: { id: true, company_name: true, email: true },
          },
          applications: {
            select: {
              creator: {
                select: {
                  email: true,
                  twitch_username: true,
                  youtube_channel_name: true,
                  stripe_connect_id: true,
                },
              },
              deal_submission: {
                select: {
                  id: true,
                  proof_urls: true,
                  screenshot_url: true,
                  posted_at: true,
                  submitted_at: true,
                  disclosure_confirmed: true,
                  status: true,
                  admin_notes: true,
                  payout_status: true,
                  stripe_transfer_id: true,
                  updated_at: true,
                },
              },
            },
          },
        },
      })
    : null

  const submissions: Submission[] = (campaign?.applications ?? [])
    .filter(a => a.deal_submission !== null)
    .map(a => ({ ...a.deal_submission!, creator: a.creator }))

  return {
    dispute: stripeDispute,
    campaign: campaign
      ? {
          id: campaign.id,
          title: campaign.title,
          objective: campaign.objective,
          brand_name: campaign.brand_name,
          product_name: campaign.product_name,
          platform: campaign.platform,
          content_type: campaign.content_type,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget: campaign.budget,
        }
      : null,
    sponsor: campaign?.sponsor ?? null,
    submissions,
  }
}

export function generateEvidence(data: DisputeData) {
  const { dispute, campaign, sponsor, submissions } = data
  const chargeId = resolveId(dispute.charge as string | { id: string } | null)
  const piId = resolveId(dispute.payment_intent as string | { id: string } | null)
  const amountDollars = (dispute.amount / 100).toFixed(2)
  const verifiedCount = submissions.filter(
    s => s.status === 'admin_verified' || s.status === 'admin_rejected',
  ).length
  const payoutDone = submissions.some(s => s.payout_status === 'paid')

  // Timeline — chronological system events derived from DB timestamps
  type TimelineEvent = { event: string; at: Date; detail?: string }
  const timeline: TimelineEvent[] = []
  if (campaign?.start_date) timeline.push({ event: 'Campaign launched', at: campaign.start_date })
  for (const sub of submissions) {
    const handle = sub.creator?.twitch_username
      ? `@${sub.creator.twitch_username}`
      : sub.creator?.youtube_channel_name
        ? `@${sub.creator.youtube_channel_name}`
        : 'creator'
    if (sub.submitted_at) timeline.push({ event: 'Content submitted', at: sub.submitted_at, detail: handle })
    if (sub.posted_at) timeline.push({ event: 'Content posted', at: sub.posted_at, detail: handle })
    if (sub.status === 'admin_verified') {
      timeline.push({ event: 'Submission admin-verified', at: sub.updated_at, detail: handle })
    }
    if (sub.payout_status === 'paid' && sub.stripe_transfer_id) {
      timeline.push({ event: 'Creator payout processed', at: sub.updated_at, detail: sub.stripe_transfer_id })
    }
  }
  timeline.sort((a, b) => a.at.getTime() - b.at.getTime())

  // Executive summary narrative
  const executiveSummary = [
    `Stripe dispute ${dispute.id} filed against charge ${chargeId ?? 'unknown'} for $${amountDollars} ${dispute.currency.toUpperCase()}.`,
    campaign
      ? `Campaign "${campaign.title}"${campaign.brand_name ? ` (${campaign.brand_name})` : ''} ran from ${campaign.start_date?.toLocaleDateString() ?? 'unknown'} to ${campaign.end_date?.toLocaleDateString() ?? 'unknown'}.`
      : 'No campaign record found matching this charge.',
    submissions.length > 0
      ? `${submissions.length} creator${submissions.length !== 1 ? 's' : ''} submitted deliverables; ${verifiedCount} verified by admin.`
      : 'No content submissions on record.',
    payoutDone ? 'Creator payout was transferred via Stripe, confirming accepted delivery.' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Proof text block for Stripe uncategorized_text
  const proofLines = submissions.flatMap(s => {
    const lines: string[] = []
    if (s.proof_urls.length > 0) lines.push(`Proof URLs: ${s.proof_urls.join(', ')}`)
    if (s.screenshot_url) lines.push(`Screenshot: ${s.screenshot_url}`)
    if (s.posted_at) lines.push(`Posted: ${s.posted_at.toISOString()}`)
    if (s.stripe_transfer_id) lines.push(`Payout transfer: ${s.stripe_transfer_id}`)
    return lines
  })

  // Stripe API evidence payload (text-only; file uploads require Stripe Files API)
  const stripeEvidence = {
    customer_name: sponsor?.company_name ?? undefined,
    customer_email: sponsor?.email ?? undefined,
    product_description: campaign
      ? `Campaign: ${campaign.title}. Payment for content deliverables per agreed terms. Brand: ${campaign.brand_name ?? 'N/A'}. Budget: $${(campaign.budget ?? 0).toLocaleString()}.`
      : 'Payment for content creator marketing campaign deliverables.',
    service_date: campaign?.start_date?.toISOString().split('T')[0] ?? undefined,
    uncategorized_text: [executiveSummary, '', ...proofLines].join('\n').slice(0, 20000),
  }

  // Full evidence package stored in disputes.evidence_json for admin display
  const fullEvidence = {
    generated_at: new Date().toISOString(),
    stripe_fields: stripeEvidence,
    executive_summary: executiveSummary,
    cover: {
      dispute_id: dispute.id,
      stripe_charge_id: chargeId,
      stripe_payment_intent_id: piId,
      amount_dollars: amountDollars,
      currency: dispute.currency,
      reason: dispute.reason,
      stripe_status: dispute.status,
    },
    campaign_brief: campaign
      ? {
          title: campaign.title,
          objective: campaign.objective,
          brand_name: campaign.brand_name,
          product_name: campaign.product_name,
          platform: campaign.platform,
          content_type: campaign.content_type,
          start_date: campaign.start_date?.toISOString() ?? null,
          end_date: campaign.end_date?.toISOString() ?? null,
          budget: campaign.budget,
        }
      : null,
    delivery_proof: submissions.map(s => ({
      creator_handle:
        s.creator?.twitch_username
          ? `@${s.creator.twitch_username}`
          : s.creator?.youtube_channel_name
            ? `@${s.creator.youtube_channel_name}`
            : s.creator?.email ?? 'unknown',
      proof_urls: s.proof_urls,
      screenshot_url: s.screenshot_url,
      posted_at: s.posted_at?.toISOString() ?? null,
      submitted_at: s.submitted_at?.toISOString() ?? null,
      disclosure_confirmed: s.disclosure_confirmed,
    })),
    acceptance_proof: submissions.map(s => ({
      status: s.status,
      admin_notes: s.admin_notes,
      payout_status: s.payout_status,
      stripe_transfer_id: s.stripe_transfer_id,
    })),
    timeline: timeline.map(e => ({
      event: e.event,
      at: e.at.toISOString(),
      detail: e.detail ?? null,
    })),
  }

  return { stripeEvidence, fullEvidence, executiveSummary }
}

export async function onDisputeCreated(stripeDispute: Stripe.Dispute) {
  // Idempotent: skip if already recorded
  const existing = await prisma.disputes.findUnique({
    where: { stripe_dispute_id: stripeDispute.id },
    select: { id: true },
  })
  if (existing) return existing

  const chargeId = resolveId(stripeDispute.charge as string | { id: string } | null)
  const piId = resolveId(stripeDispute.payment_intent as string | { id: string } | null)
  const dueBySecs = stripeDispute.evidence_details?.due_by
  const dueBy = dueBySecs
    ? new Date(dueBySecs * 1000)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // default 14-day window

  const data = await fetchDisputeData(stripeDispute)
  const { fullEvidence, executiveSummary } = generateEvidence(data)

  const dispute = await prisma.disputes.create({
    data: {
      stripe_dispute_id: stripeDispute.id,
      campaign_id: data.campaign?.id ?? null,
      stripe_charge_id: chargeId,
      stripe_payment_intent_id: piId,
      amount: stripeDispute.amount,
      currency: stripeDispute.currency,
      reason: stripeDispute.reason,
      status: 'draft',
      evidence_json: fullEvidence as object,
      executive_summary: executiveSummary,
      due_by: dueBy,
    },
  })

  await prisma.dispute_events.create({
    data: {
      dispute_id: dispute.id,
      event_type: 'dispute_received',
      metadata: {
        stripe_reason: stripeDispute.reason,
        amount: stripeDispute.amount,
        due_by: dueBy.toISOString(),
      },
    },
  })

  // Notify all admins
  const admins = await prisma.admins.findMany({ select: { clerk_user_id: true } })
  const amountStr = `$${(stripeDispute.amount / 100).toFixed(2)}`
  await Promise.all(
    admins.map(admin =>
      createNotification({
        userId: admin.clerk_user_id,
        role: 'admin',
        type: NOTIFICATION_TYPES.DISPUTE_CREATED,
        title: 'New dispute received',
        message: `A ${amountStr} dispute (${stripeDispute.reason.replace(/_/g, ' ')}) needs your review. Evidence due ${dueBy.toLocaleDateString()}.`,
        link: `/admin/disputes/${dispute.id}`,
        dedupeKey: stripeDispute.id,
      }),
    ),
  )

  console.log(
    `[disputes] created dispute ${stripeDispute.id} — campaign ${data.campaign?.id ?? 'unknown'}, due ${dueBy.toISOString()}`,
  )
  return dispute
}
