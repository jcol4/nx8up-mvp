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
        <label className="sp-app-stat-label mb-1.5 block">Admin notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          disabled={isSubmitted}
          placeholder="Add context, rebuttal points, or review notes before submitting…"
          className="w-full resize-none rounded-lg border border-white/12 bg-black/25 px-3 py-2.5 text-sm text-[#e8f4ff] placeholder:cr-stat-caption focus:border-[#99f7ff]/45 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSaveNotes}
          disabled={saving || isSubmitted}
          className="rounded-lg border border-white/12 bg-black/25 px-4 py-2 text-sm font-medium text-[#e8f4ff] transition hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/10 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save notes'}
        </button>

        {!isSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/15 px-4 py-2 text-sm font-semibold text-[#bffcff] transition hover:bg-[#99f7ff]/25 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit to Stripe'}
          </button>
        )}

        {saveMsg && (
          <span className={`text-xs ${saveMsg.startsWith('Error') ? 'text-[#fca5a5]' : 'text-[#86efac]'}`}>
            {saveMsg}
          </span>
        )}
        {submitMsg && (
          <span className={`text-xs ${submitMsg.startsWith('Error') ? 'text-[#fca5a5]' : 'text-[#86efac]'}`}>
            {submitMsg}
          </span>
        )}
      </div>
    </div>
  )
}
