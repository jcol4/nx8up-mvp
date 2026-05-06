'use client'

import { useState } from 'react'
import RequestRefundModal from './RequestRefundModal'

type Props = {
  campaignId: string
  campaignTitle: string
  hasAcceptedCreators: boolean
}

export default function RequestRefundButton({ campaignId, campaignTitle, hasAcceptedCreators }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
      >
        Request refund
      </button>
      {open && (
        <RequestRefundModal
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          hasAcceptedCreators={hasAcceptedCreators}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
