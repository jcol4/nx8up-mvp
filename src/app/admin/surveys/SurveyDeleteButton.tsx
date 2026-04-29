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
          className="rounded px-1.5 py-0.5 text-xs text-[#a9abb5] transition-colors hover:bg-white/10 hover:text-[#e8f4ff]"
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
      className="rounded px-1.5 py-0.5 text-xs font-medium text-red-300/80 transition-colors hover:bg-red-500/15 hover:text-red-300"
    >
      Delete
    </button>
  )
}
