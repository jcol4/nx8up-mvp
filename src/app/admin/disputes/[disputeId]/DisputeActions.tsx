'use client'

import { useState } from 'react'
import { updateAdminNotes, submitToStripe } from './_actions'

type Props = {
  disputeId: string
  initialNotes: string
  status: string
}

export default function DisputeActions({ disputeId, initialNotes, status }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  async function handleSaveNotes() {
    setSaving(true)
    setSaveMsg(null)
    const res = await updateAdminNotes(disputeId, notes)
    setSaving(false)
    setSaveMsg(res.error ? `Error: ${res.error}` : 'Notes saved.')
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function handleSubmit() {
    const confirmed = window.confirm(
      'Submit this evidence to Stripe? This action cannot be undone — Stripe will receive the package immediately.',
    )
    if (!confirmed) return

    setSubmitting(true)
    setSubmitMsg(null)
    const res = await submitToStripe(disputeId)
    setSubmitting(false)
    if (res.error) {
      setSubmitMsg(`Error: ${res.error}`)
    } else {
      setSubmitMsg('Submitted to Stripe.')
    }
  }

  const isSubmitted = status === 'submitted' || status === 'won' || status === 'lost'

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs dash-text-muted uppercase tracking-wide block mb-1">
          Admin Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          disabled={isSubmitted}
          placeholder="Add context, rebuttal points, or review notes before submitting…"
          className="w-full rounded-lg bg-[#0a1628] border border-[#1e3a5f] text-sm dash-text p-3 resize-none focus:outline-none focus:border-[#00c8ff]/50 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSaveNotes}
          disabled={saving || isSubmitted}
          className="px-4 py-2 text-sm rounded-lg bg-[#1e3a5f] dash-text-bright hover:bg-[#264d7a] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>

        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-lg bg-[#00c8ff] text-[#060d1b] font-semibold hover:bg-[#00b0e0] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit to Stripe'}
          </button>
        )}

        {saveMsg && (
          <span className={`text-xs ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {saveMsg}
          </span>
        )}
        {submitMsg && (
          <span className={`text-xs ${submitMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {submitMsg}
          </span>
        )}
      </div>
    </div>
  )
}
