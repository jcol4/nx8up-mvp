'use client'

import { useState, useTransition } from 'react'
import { requestOptOut } from '@/app/creator/campaigns/_actions'
import { useRouter } from 'next/navigation'

type Props = {
  applicationId: string
  campaignTitle: string
}

export default function OptOutButton({ applicationId, campaignTitle }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    setError('')
    startTransition(async () => {
      const res = await requestOptOut(applicationId, reason)
      if (res.error) {
        setError(res.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen(true) }}
        className="text-xs text-red-400 hover:text-red-300 hover:underline underline-offset-2 transition-colors"
      >
        Opt out
      </button>
    )
  }

  return (
    <div
      className="mt-3 space-y-2 border-t border-white/10 pt-3"
      onClick={(e) => e.preventDefault()}
    >
      <p className="text-xs text-[#c4cad6]">
        Opting out of <span className="font-medium text-[#e8f4ff]">{campaignTitle}</span>. Please provide a reason:
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain why you need to opt out…"
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-[#c8dff0] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-red-400/40 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !reason.trim()}
          className="rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Submitting…' : 'Submit opt-out request'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
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
