'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishCampaign } from '@/app/sponsor/campaigns/_actions'

type Props = { id: string }

export default function PublishCampaignButton({ id }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handlePublish = () => {
    setError('')
    startTransition(async () => {
      const result = await publishCampaign(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/sponsor/campaigns/${id}/pay`)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="text-xs px-2.5 py-1 rounded-lg bg-[#00c8ff] text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'Publishing...' : 'Publish'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
