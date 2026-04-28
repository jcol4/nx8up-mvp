'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { launchCampaign } from '@/app/sponsor/campaigns/_actions'

type Props = { id: string }

export default function LaunchCampaignButton({ id }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleLaunch = () => {
    setError('')
    startTransition(async () => {
      const result = await launchCampaign(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleLaunch}
        disabled={isPending}
        className="rounded-lg bg-[#c084fc] px-2.5 py-1 text-xs font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Launching...' : 'Launch'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
