'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SurveyDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    await fetch(`/api/admin/surveys/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded px-1.5 py-0.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
        >
          {loading ? '…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-white/12 px-2 py-0.5 text-xs font-medium cr-text-muted transition hover:border-[#99f7ff]/35 hover:text-[#bffcff]"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-300 transition-colors hover:border-red-400/50 hover:bg-red-500/15"
    >
      Delete
    </button>
  )
}
