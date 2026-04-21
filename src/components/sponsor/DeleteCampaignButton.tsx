/**
 * DeleteCampaignButton — inline two-step confirmation delete button for campaigns.
 * First click shows "Delete?" prompt; second click fires the server action.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="flex items-center gap-2 text-xs">
      <span className="dash-text-muted">Delete?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : 'Yes'}
      </button>
      <button
        type="button"
        onClick={() => { setIsConfirming(false); setError('') }}
        disabled={isPending}
        className="dash-text-muted hover:text-[#c8dff0] transition-colors"
      >
        No
      </button>
      {error && <span className="text-red-400">{error}</span>}
    </div>
  )
}
