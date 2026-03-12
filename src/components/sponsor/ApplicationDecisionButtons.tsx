'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import SecondaryButton from '@/components/ui/SecondaryButton'
import { setApplicationStatus } from '@/app/sponsor/campaigns/_actions'

type Props = {
  applicationId: string
  campaignId: string
  currentStatus: string
}

export default function ApplicationDecisionButtons({ applicationId, campaignId, currentStatus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleUpdate = (status: 'accepted' | 'rejected') => {
    startTransition(async () => {
      await setApplicationStatus(applicationId, campaignId, status)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2 mt-3">
      <SecondaryButton
        className="w-auto px-3 py-1.5"
        disabled={isPending || currentStatus === 'accepted'}
        onClick={() => handleUpdate('accepted')}
      >
        {currentStatus === 'accepted' ? 'Accepted' : isPending ? 'Accepting…' : 'Accept'}
      </SecondaryButton>
      <SecondaryButton
        variant="danger"
        className="w-auto px-3 py-1.5"
        disabled={isPending || currentStatus === 'rejected'}
        onClick={() => handleUpdate('rejected')}
      >
        {currentStatus === 'rejected' ? 'Rejected' : isPending ? 'Rejecting…' : 'Reject'}
      </SecondaryButton>
    </div>
  )
}
