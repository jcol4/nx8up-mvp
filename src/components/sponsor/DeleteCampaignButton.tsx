'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import SecondaryButton from '@/components/ui/SecondaryButton'
import { deleteCampaign } from '@/app/sponsor/campaigns/_actions'

type Props = {
  id: string
}

export default function DeleteCampaignButton({ id }: Props) {
  const router = useRouter()
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      setError('')
      const res = await deleteCampaign(id)
      if (res.error) {
        setError(res.error)
        return
      }
      router.refresh()
      setIsConfirming(false)
    })
  }

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="text-xs text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2 text-xs">
      <p className="dash-text-muted max-w-xs text-right">
        This will permanently delete this campaign and all of its applications. This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <SecondaryButton
          variant="danger"
          className="w-auto px-3 py-1.5"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? 'Deleting…' : 'Confirm delete'}
        </SecondaryButton>
        <SecondaryButton
          className="w-auto px-3 py-1.5"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
        >
          Cancel
        </SecondaryButton>
      </div>
      {error && <p className="text-red-400 mt-1">{error}</p>}
    </div>
  )
}
