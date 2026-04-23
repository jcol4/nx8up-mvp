'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

async function assertAdmin() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') throw new Error('Unauthorized')
}

export async function getDisputeById(disputeId: string) {
  await assertAdmin()
  return prisma.disputes.findUnique({
    where: { id: disputeId },
    include: {
      events: { orderBy: { occurred_at: 'asc' } },
      campaign: {
        select: {
          id: true,
          title: true,
          brand_name: true,
          sponsor: { select: { company_name: true, email: true } },
        },
      },
    },
  })
}

export async function getDisputes() {
  await assertAdmin()
  return prisma.disputes.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      campaign: {
        select: { title: true, brand_name: true },
      },
    },
  })
}

export async function updateAdminNotes(
  disputeId: string,
  notes: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  await prisma.disputes.update({
    where: { id: disputeId },
    data: { admin_notes: notes || null },
  })

  revalidatePath(`/admin/disputes/${disputeId}`)
  return { success: true }
}

export async function submitToStripe(
  disputeId: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await assertAdmin()
  } catch {
    return { error: 'Unauthorized' }
  }

  const dispute = await prisma.disputes.findUnique({ where: { id: disputeId } })
  if (!dispute) return { error: 'Dispute not found.' }
  if (dispute.status === 'submitted') return { error: 'Already submitted to Stripe.' }

  const evidence = dispute.evidence_json as {
    stripe_fields?: {
      customer_name?: string
      customer_email?: string
      product_description?: string
      service_date?: string
      uncategorized_text?: string
    }
    executive_summary?: string
  } | null

  const stripeFields = evidence?.stripe_fields ?? {}
  const summaryText = [
    evidence?.executive_summary ?? '',
    dispute.admin_notes ? `\n\nAdmin notes: ${dispute.admin_notes}` : '',
  ]
    .join('')
    .trim()
    .slice(0, 20000)

  try {
    await stripe.disputes.update(dispute.stripe_dispute_id, {
      evidence: {
        ...(stripeFields.customer_name ? { customer_name: stripeFields.customer_name } : {}),
        ...(stripeFields.customer_email ? { customer_email: stripeFields.customer_email } : {}),
        ...(stripeFields.product_description
          ? { product_description: stripeFields.product_description }
          : {}),
        ...(stripeFields.service_date ? { service_date: stripeFields.service_date } : {}),
        uncategorized_text: summaryText || stripeFields.uncategorized_text,
      },
      submit: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe API error'
    await prisma.disputes.update({
      where: { id: disputeId },
      data: { stripe_submission_status: `error: ${msg}` },
    })
    return { error: msg }
  }

  await prisma.disputes.update({
    where: { id: disputeId },
    data: {
      status: 'submitted',
      submitted_at: new Date(),
      stripe_submission_status: 'submitted',
    },
  })

  await prisma.dispute_events.create({
    data: {
      dispute_id: disputeId,
      event_type: 'evidence_submitted',
      metadata: { submitted_by: 'admin' },
    },
  })

  revalidatePath(`/admin/disputes/${disputeId}`)
  revalidatePath('/admin/disputes')
  return { success: true }
}
