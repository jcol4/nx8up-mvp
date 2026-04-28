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
    <div className="dash-panel dash-panel--nx-top mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#99f7ff]/25 border-t-2 border-t-[#bffcff] bg-[#99f7ff]/[0.08] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#99f7ff]">Payout account required</p>
        <p className="mt-0.5 text-xs text-[#a9abb5]">
          {hasAccount
            ? 'Your payout setup is incomplete. Finish connecting to receive payments.'
            : 'Connect a bank account to receive payments from sponsors.'}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="shrink-0 rounded-md bg-[#99f7ff] px-3 py-1.5 text-sm font-medium text-slate-900 transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Redirecting…' : hasAccount ? 'Complete setup' : 'Connect payout'}
      </button>
    </div>
  )
}
