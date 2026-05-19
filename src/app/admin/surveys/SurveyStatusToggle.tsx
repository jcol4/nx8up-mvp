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
      className={`rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
        status === 'active'
          ? 'border-red-400/35 bg-red-500/10 text-red-300 hover:border-red-400/55 hover:bg-red-500/15'
          : 'border-[#99f7ff]/45 bg-[#99f7ff]/12 text-[#bffcff] hover:border-[#99f7ff]/65 hover:bg-[#99f7ff]/20 hover:text-white'
      }`}
    >
      {loading ? '…' : label}
    </button>
  )
}
