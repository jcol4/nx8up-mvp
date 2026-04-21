/**
 * Stripe client singleton.
 *
 * A single Stripe instance is reused across the entire server process.
 * In development, the instance is pinned to `globalThis` so that Next.js
 * hot-module replacement doesn't create a new client on every file change
 * (which would exhaust connection pools and produce misleading logs).
 * In production there is only one process start, so the globalThis cache
 * is unnecessary and skipped.
 */
import Stripe from 'stripe'

const globalForStripe = globalThis as unknown as { stripe: Stripe | undefined }

export const stripe =
  globalForStripe.stripe ??
  new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
    // Retry transient errors (network failures, 429 rate limits, 500s) up to
    // 2 additional times with exponential backoff. The SDK only retries requests
    // that are safe to retry — idempotent GETs always, POSTs only when an
    // Idempotency-Key header is present.
    maxNetworkRetries: 2,
  })

if (process.env.NODE_ENV !== 'production') globalForStripe.stripe = stripe
