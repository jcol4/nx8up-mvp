/**
 * InviteResponseButtons — accept/decline buttons for sponsor-invited campaign applications.
 * Uses useTransition for optimistic pending state; refreshes the route on success.
 */
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { respondToInvitation } from '@/app/creator/campaigns/_actions'

type Props = {
  applicationId: string
}

export default function InviteResponseButtons({ applicationId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handle = (response: 'accept' | 'decline') => {
    startTransition(async () => {
      await respondToInvitation(applicationId, response)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handle('accept')}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 hover:bg-[#22c55e]/20 transition-colors disabled:opacity-40"
      >
        {isPending ? '…' : 'Accept'}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handle('decline')}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 cr-text-muted border border-white/10 hover:border-white/20 transition-colors disabled:opacity-40"
      >
        {isPending ? '…' : 'Decline'}
      </button>
    </div>
  )
}
