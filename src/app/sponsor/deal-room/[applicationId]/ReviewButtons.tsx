/**
 * ReviewButtons — client component for the sponsor to approve or request revision
 * on a creator's deal submission.
 *
 * Renders:
 * - An optional notes textarea (initially hidden; revealed by clicking "+ Add notes").
 *   Once visible (or when pre-populated notes exist), it always stays visible.
 * - "Approve" button — calls `updateSubmissionStatus(applicationId, 'approved', notes)`.
 * - "Request Revision" button — calls `updateSubmissionStatus(applicationId, 'revision_requested', notes)`.
 *
 * Uses React's `useTransition` for optimistic pending state. On success, triggers
 * `router.refresh()` to re-render the parent page with the updated status.
 *
 * Note: Both buttons share the same `isPending` state, so clicking either one
 * disables both during the transition.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateSubmissionStatus } from '../_actions'

type Props = { applicationId: string; currentNotes: string | null }

export default function ReviewButtons({ applicationId, currentNotes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [showNotes, setShowNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function act(status: 'approved' | 'revision_requested') {
    startTransition(async () => {
      const result = await updateSubmissionStatus(applicationId, status, notes || undefined)
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
      {showNotes || notes ? (
        <div>
          <label className="block text-xs font-medium dash-text-muted uppercase tracking-wide mb-1.5">
            Notes for creator (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain what needs to be revised, or leave blank for approval…"
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-sm border border-white/10 bg-black/20 text-[#c8dff0] focus:outline-none focus:border-[#00c8ff]/50 resize-none placeholder:text-[#4a6080]"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="text-xs dash-text-muted hover:text-[#c8dff0] transition-colors"
        >
          + Add notes for creator
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => act('approved')}
          disabled={isPending}
          className="flex-1 py-2 rounded-lg text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => act('revision_requested')}
          disabled={isPending}
          className="flex-1 py-2 rounded-lg text-sm font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Request Revision'}
        </button>
      </div>
    </div>
  )
}
