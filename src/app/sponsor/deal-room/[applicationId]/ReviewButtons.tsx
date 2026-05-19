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
          <label className="cr-field-label mb-1.5 block">
            Notes for creator (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain what needs to be revised, or leave blank for approval…"
            rows={3}
            className="w-full resize-none rounded-lg border border-white/15 bg-black/25 px-3 py-2.5 text-sm text-[#e8f4ff] placeholder:cr-text-muted focus:border-[#99f7ff]/40 focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="text-xs cr-text-muted transition-colors hover:text-[#e8f4ff]"
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
