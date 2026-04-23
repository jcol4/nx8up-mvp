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
      className={`text-xs transition-colors ${
        status === 'active'
          ? 'text-[#f87171]/70 hover:text-[#f87171]'
          : 'text-[#22c55e]/70 hover:text-[#22c55e]'
      }`}
    >
      {loading ? '…' : label}
    </button>
  )
}
