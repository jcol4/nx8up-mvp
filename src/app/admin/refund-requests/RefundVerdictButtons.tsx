'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitRefundVerdict } from './_actions'

type Props = { requestId: string }

export default function RefundVerdictButtons({ requestId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)

  const submit = (verdict: 'valid' | 'invalid') => {
    setError('')
    startTransition(async () => {
      const res = await submitRefundVerdict(requestId, verdict, notes || undefined)
      if (res.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-xs text-[#99f7ff] hover:underline underline-offset-2"
      >
        Review →
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Admin notes (optional)"
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-[#c8dff0] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#99f7ff]/40 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit('valid')}
          disabled={isPending}
          className="rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 px-3 py-1.5 text-xs font-semibold text-[#4ade80] hover:bg-[#22c55e]/25 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Valid reason'}
        </button>
        <button
          type="button"
          onClick={() => submit('invalid')}
          disabled={isPending}
          className="rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Invalid reason'}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          disabled={isPending}
          className="text-xs text-[#6b7280] hover:text-[#a9abb5]"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
