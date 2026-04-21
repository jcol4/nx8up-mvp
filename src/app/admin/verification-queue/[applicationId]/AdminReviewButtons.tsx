/**
 * Admin submission review controls for the deal room detail page.
 *
 * Client component that renders:
 *  - A textarea for optional review notes (included in the creator notification
 *    and stored as `admin_notes` on the submission).
 *  - "Approve & Send to Sponsor" button — calls `adminReviewSubmission` with
 *    decision `"admin_verified"`.
 *  - "Reject" button — calls `adminReviewSubmission` with decision
 *    `"admin_rejected"`.
 *
 * Uses `useTransition` to show a pending state (`"…"`) on both buttons while
 * the server action is in flight. On success the page is refreshed via
 * `router.refresh()` so the parent server component re-renders with the updated
 * submission status (hiding the review form and showing the outcome banner).
 *
 * Errors returned by the server action are displayed as inline red text.
 */
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

  /** Invokes the server action inside a React transition to track pending state. */
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
        <label className="block text-xs font-medium dash-text-muted uppercase tracking-wide mb-1.5">
          Notes for creator / sponsor (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this review decision…"
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 text-sm border border-white/10 bg-black/20 text-[#c8dff0] focus:outline-none focus:border-[#00c8ff]/50 resize-none placeholder:text-[#4a6080]"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => act('admin_verified')}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/30 hover:bg-[#00c8ff]/30 disabled:opacity-50 transition-colors"
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
