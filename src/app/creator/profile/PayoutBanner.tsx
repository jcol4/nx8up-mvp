/**
 * PayoutBanner — client component that renders a warning banner when the
 * creator has not completed Stripe Connect onboarding.
 *
 * Clicking the action button POSTs to `/api/stripe/connect/onboard` which
 * returns a Stripe-hosted onboarding URL. The user is redirected to Stripe
 * via `window.location.href`.
 *
 * Two states:
 *  - `hasAccount = false` → "Connect payout" (no Stripe account yet)
 *  - `hasAccount = true`  → "Complete setup" (account exists but onboarding
 *    is incomplete, e.g. documents pending)
 *
 * External services: Stripe Connect via the `/api/stripe/connect/onboard`
 * route. No env vars are consumed directly in this component.
 */
'use client'

import { useState } from 'react'

export default function PayoutBanner({ hasAccount }: { hasAccount: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding')
      setLoading(false)
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-yellow-300">Payout account required</p>
        <p className="text-xs cr-text-muted mt-0.5">
          {hasAccount
            ? 'Your payout setup is incomplete. Finish connecting to receive payments.'
            : 'Connect a bank account to receive payments from sponsors.'}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-md bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Redirecting…' : hasAccount ? 'Complete setup' : 'Connect payout'}
      </button>
    </div>
  )
}
