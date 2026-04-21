/**
 * Admin review controls for sponsor age-restriction change requests.
 *
 * Client component that renders a notes textarea and Approve/Deny buttons for
 * the `sponsor_age_restriction_requests` detail page.
 *
 * On submission, calls the `reviewAgeRestrictionRequest` server action with the
 * selected decision and any optional admin notes (max 500 chars enforced by the
 * textarea `maxLength`).
 *
 * On success: navigates back to `/admin/sponsor-profile-changes` and calls
 * `router.refresh()` to invalidate the cache. On error: displays the error
 * message inline.
 *
 * Gotcha: `isSubmitting` is managed manually via `useState` (set before the
 * async call, cleared after). If the component unmounts during the in-flight
 * request (e.g., due to navigation), this will cause a React "setState on
 * unmounted component" warning. Using `useTransition` (as in
 * `AdminReviewButtons`) would be safer.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewAgeRestrictionRequest } from '../_actions'

type Props = {
  requestId: string
}

export default function ReviewButtons({ requestId }: Props) {
  const router = useRouter()
  const [adminNotes, setAdminNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  /** Calls the server action and handles navigation/error on completion. */
  async function handle(decision: 'approved' | 'denied') {
    setError('')
    setIsSubmitting(true)
    const res = await reviewAgeRestrictionRequest(requestId, decision, adminNotes)
    setIsSubmitting(false)
    if (res.error) {
      setError(res.error)
    } else {
      router.push('/admin/sponsor-profile-changes')
      router.refresh()
    }
  }

  return (
    <div className="dash-panel p-5 space-y-4">
      <h2 className="text-sm font-semibold dash-text-bright">Admin Decision</h2>

      <div>
        <label className="block text-xs font-medium dash-text-muted mb-1.5 uppercase tracking-wide">
          Admin notes <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          placeholder="Add notes visible to the sponsor (optional)"
          rows={3}
          maxLength={500}
          className="w-full rounded-lg p-3 text-sm border border-white/10 bg-white/[0.03] text-[#c8dff0] focus:outline-none focus:border-[#00c8ff]/50 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => handle('approved')}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Processing…' : 'Approve'}
        </button>
        <button
          onClick={() => handle('denied')}
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Processing…' : 'Deny'}
        </button>
      </div>
    </div>
  )
}
