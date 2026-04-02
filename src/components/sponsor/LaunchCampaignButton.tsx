'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { launchCampaign } from '@/app/sponsor/campaigns/_actions'

type Props = { id: string }

export default function LaunchCampaignButton({ id }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLaunch = () => {
    startTransition(async () => {
      const result = await launchCampaign(id)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleLaunch}
      disabled={isPending}
      className="text-xs px-2.5 py-1 rounded-lg bg-[#a855f7] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {isPending ? 'Launching...' : 'Launch'}
    </button>
  )
}
