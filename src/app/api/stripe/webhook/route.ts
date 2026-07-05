/**
 * POST /api/stripe/webhook
 *
 * Thin adapter over the Stripe webhook seam. It verifies the event signature against
 * STRIPE_WEBHOOK_SECRET — the webhook's only authentication — and hands the verified event
 * to `handleStripeEvent` (see lib/stripe-webhook.ts), which owns all per-event domain logic.
 *
 * Always returns 200 { received: true } on success so Stripe stops retrying.
 */
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { handleStripeEvent } from '@/lib/stripe-webhook'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    await handleStripeEvent(event)
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
