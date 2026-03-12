'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyToCampaign } from '../_actions'

export default function ApplyButton({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function handleApply() {
    setLoading(true)
    setError(null)
    const res = await applyToCampaign(campaignId, message)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-lg font-semibold text-sm bg-[#00c8ff] text-[#0a1223] hover:bg-[#00b0e0] transition-colors"
      >
        Apply to This Campaign
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional: tell the sponsor why you're a great fit..."
        rows={4}
        className="w-full rounded-lg p-3 text-sm cr-border border cr-bg-inner cr-text resize-none focus:outline-none focus:border-[#00c8ff]/50"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 rounded-lg text-sm cr-text-muted border cr-border hover:border-[rgba(0,200,255,0.3)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-[#00c8ff] text-[#0a1223] hover:bg-[#00b0e0] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}