'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const REFUND_REASONS = [
  { value: 'budget_constraints',       key: 'refundReasonBudget' },
  { value: 'strategy_changed',         key: 'refundReasonStrategy' },
  { value: 'alternative_solution',     key: 'refundReasonAlternative' },
  { value: 'timeline_no_longer_works', key: 'refundReasonTimeline' },
  { value: 'other',                    key: 'refundReasonOther' },
]

type Props = {
  campaignId: string
  campaignTitle: string
  hasAcceptedCreators: boolean
  onClose: () => void
}

export default function RequestRefundModal({ campaignId, campaignTitle, hasAcceptedCreators, onClose }: Props) {
  const t = useTranslations('sponsor.actions')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [reasonCategory, setReasonCategory] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = () => {
    if (!reasonCategory) {
      setError(t('refundSelectReason'))
      return
    }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, reasonCategory, reasonDetail: reasonDetail.trim() || undefined }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? t('refundGenericError'))
      } else {
        setDone(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={done ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
        {done ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30">
              <svg className="h-6 w-6 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-[#e8f4ff]">{t('refundRequestedTitle')}</p>
              <p className="mt-1 text-sm text-[#a9abb5]">
                {t('refundRequestedDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-white/5 border border-white/10 py-2 text-sm font-medium text-[#c8dff0] hover:bg-white/10 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[#e8f4ff]">{t('refundModalTitle')}</h2>
              <p className="mt-1 text-sm text-[#a9abb5]">
                {t('refundCampaignLabel')} <span className="text-[#c8dff0] font-medium">{campaignTitle}</span>
              </p>
            </div>

            {hasAcceptedCreators && (
              <div className="flex items-start gap-2.5 rounded-lg border border-orange-500/25 bg-orange-500/10 p-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-orange-300">
                  {t('refundAcceptedWarning')}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/10 p-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-red-300">
                {t('refundIrreversibleWarning')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#c8dff0]">{t('refundReasonLabel')}</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#c8dff0] focus:outline-none focus:ring-1 focus:ring-[#99f7ff]/40"
              >
                <option value="" disabled>{t('refundSelectPlaceholder')}</option>
                {REFUND_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{t(r.key)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#a9abb5]">
                {t('refundDetailLabel')} <span className="text-[#6b7280]">{t('optional')}</span>
              </label>
              <textarea
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder={t('refundDetailPlaceholder')}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#c8dff0] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-[#99f7ff]/40 resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm font-medium text-[#c8dff0] hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !reasonCategory}
                className="flex-1 rounded-lg bg-red-500/80 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isPending ? t('submitting') : t('requestRefund')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
