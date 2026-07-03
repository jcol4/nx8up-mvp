'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adminReviewSubmission } from '../_actions'

type Props = { applicationId: string }

export default function AdminReviewButtons({ applicationId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function act(decision: 'admin_verified' | 'admin_rejected') {
    startTransition(async () => {
      const result = await adminReviewSubmission(applicationId, decision, notes || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setError(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="sp-app-stat-label mb-1.5 block">
          Notes for creator / sponsor (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this review decision…"
          rows={3}
          className="w-full resize-none rounded-lg border border-white/12 bg-black/25 px-3 py-2.5 text-sm text-[#e8f4ff] placeholder:cr-stat-caption focus:border-[#99f7ff]/45 focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => act('admin_verified')}
          disabled={isPending}
          className="flex-1 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/15 py-2.5 text-sm font-semibold text-[#bffcff] transition-colors hover:bg-[#99f7ff]/25 disabled:opacity-50"
        >
          {isPending ? '…' : 'Approve & Send to Sponsor'}
        </button>
        <button
          type="button"
          onClick={() => act('admin_rejected')}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
