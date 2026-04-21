/**
 * PublishCampaignButton — moves a draft campaign to pending_payment and redirects to checkout.
 * NOTE: Errors are shown via browser alert() — inconsistent with the rest of the app's error UI.
 */
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
      const result = await publishCampaign(id)
      if (result.error) {
        alert(result.error)
      } else {
        // Campaign is pending_payment — send sponsor straight to checkout
        router.push(`/sponsor/campaigns/${id}/pay`)
      }
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
