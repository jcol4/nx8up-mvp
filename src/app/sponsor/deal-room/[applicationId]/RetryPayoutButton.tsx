'use client'

import { useState, useTransition } from 'react'
import { retryPayout } from '../_actions'

export default function RetryPayoutButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleRetry() {
    setError(null)
    startTransition(async () => {
      const result = await retryPayout(applicationId)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
        <p className="text-xs text-[#22c55e]">Payout sent successfully.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-400">Payout failed — click to retry.</p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Retrying…' : 'Retry Payout'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
