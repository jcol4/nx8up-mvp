'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SurveyStatusToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const nextStatus = status === 'active' ? 'closed' : status === 'closed' ? 'active' : 'active'
    await fetch(`/api/admin/surveys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    router.refresh()
    setLoading(false)
  }

  const label = status === 'active' ? 'Close' : 'Activate'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
        status === 'active'
          ? 'text-[#fca5a5] hover:bg-[#f87171]/15 hover:text-[#f87171]'
          : 'text-[#86efac] hover:bg-[#22c55e]/15 hover:text-[#22c55e]'
      }`}
    >
      {loading ? '…' : label}
    </button>
  )
}
