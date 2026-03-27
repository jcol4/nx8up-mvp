'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishCampaign } from '@/app/sponsor/campaigns/_actions'

type Props = { id: string }

export default function PublishCampaignButton({ id }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    startTransition(async () => {
      await publishCampaign(id)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPending}
      className="text-xs px-2.5 py-1 rounded-lg bg-[#00c8ff] text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {isPending ? 'Publishing...' : 'Publish'}
    </button>
  )
}
