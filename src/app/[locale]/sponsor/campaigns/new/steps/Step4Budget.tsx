'use client'

import { useTranslations, useFormatter } from 'next-intl'
import NXStepper from '@/components/ui/NXStepper'
import NXDatePicker from '@/components/ui/NXDatePicker'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle } from '../_shared'
import { NX_FEE_RATE, calcFeeBreakdown, BUDGET_MAX } from '@/lib/constants'
import { TIER_COOLDOWN_DAYS } from '@/lib/reputation'
import type { ReputationTier } from '@/lib/reputation'

const BUDGET_STEP = 500
const COUNT_STEP  = 1

/** Returns the number of business days (Mon–Fri) between today and a date string. */
function businessDaysUntil(dateStr: string): number {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(dateStr + 'T00:00:00')
  if (end <= start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur < end) {
    cur.setDate(cur.getDate() + 1)
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  error: string
  onNext: () => void
  onBack: () => void
  reputationTier?: string
}

export default function Step4Budget({ draft, setDraft, error, onNext, onBack, reputationTier = 'neutral' }: Props) {
  const t = useTranslations('sponsor.campaignWizard')
  const tEnum = useTranslations('enums')
  const format = useFormatter()
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }))

  const budgetNum = parseInt(draft.budget, 10) || 0
  const creatorCount = draft.creator_count ? parseInt(draft.creator_count, 10) : null
  const { fee, creatorPool, perCreator } = calcFeeBreakdown(budgetNum, creatorCount)

  const today = new Date().toISOString().split('T')[0]

  const achSelected = draft.preferred_payment_method === 'ach' || draft.preferred_payment_method === 'both'
  const startDateClose = draft.start_date ? businessDaysUntil(draft.start_date) <= 5 : false
  const showAchStartWarning = achSelected && startDateClose && !!draft.start_date

  return (
    <div className="space-y-6">
      {/* Budget */}
      <div className={sectionClass}>
        <p className={sectionTitle}>{t('s4Budget')}</p>
        <div>
          <label className={labelClass}>
            {t('s4TotalBudget')} <span className="text-[#99f7ff]">*</span>
          </label>
          <NXStepper
            value={draft.budget}
            onChange={v => set('budget', v)}
            step={BUDGET_STEP}
            min={0}
            max={BUDGET_MAX}
            prefix="$"
            placeholder="0"
          />
          <p className="text-xs dash-text-muted mt-1.5">
            {t('s4BudgetHint', { step: format.number(BUDGET_STEP) })}
          </p>
          {budgetNum > BUDGET_MAX && (
            <div className="mt-2 flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/8">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-amber-400 leading-relaxed">
                <span className="font-semibold">{t('s4BudgetLimitTitle')}</span>{' '}
                {t.rich('s4BudgetLimitDesc', {
                  max: `$${format.number(BUDGET_MAX)}`,
                  b: (chunks) => <span className="font-semibold">{chunks}</span>,
                })}
              </p>
            </div>
          )}
          {budgetNum > 0 && (
            <div className="mt-3 p-3 rounded-lg border border-[rgba(153,247,255,0.15)] bg-[rgba(153,247,255,0.04)] space-y-1.5">
              <p className="text-nx-10 font-semibold uppercase tracking-widest dash-text-muted">{t('s4BudgetBreakdown')}</p>
              <div className="flex justify-between text-xs">
                <span className="dash-text-muted">{t('s4TotalBudgetLabel')}</span>
                <span className="dash-text-bright">${format.number(budgetNum)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="dash-text-muted">{t('feeLabel', { pct: Math.round(NX_FEE_RATE * 100) })}</span>
                <span className="text-red-400">−${format.number(fee)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-1.5 border-t border-white/10">
                <span className="dash-text-bright">{t('creatorPoolLabel')}</span>
                <span className="text-[#22c55e]">${format.number(creatorPool)}</span>
              </div>
              {perCreator && (
                <p className="text-nx-11 dash-text-muted">{t('s4PerCreator', { amount: format.number(perCreator) })}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Creator count — hidden for direct invite (always 1) */}
      {!draft.is_direct_invite && (
        <div className={sectionClass}>
          <p className={sectionTitle}>{t('s4CreatorCount')}</p>
          <div>
            <label className={labelClass}>
              {t('s4NumCreators')} <span className="text-[#99f7ff]">*</span>
            </label>
            <NXStepper
              value={draft.creator_count}
              onChange={v => set('creator_count', v)}
              step={COUNT_STEP}
              min={1}
              placeholder="0"
              className="max-w-[180px]"
            />
            {perCreator && (
              <p className="text-xs dash-text-muted mt-1.5">
                {t('s4PerCreatorAfterFee', { amount: format.number(perCreator) })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment model */}
      <div className={sectionClass}>
        <p className={sectionTitle}>{t('s4PaymentModel')}</p>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(153,247,255,0.18)] bg-[rgba(153,247,255,0.04)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#99f7ff] shadow-[0_0_8px_rgba(153,247,255,0.6)] shrink-0" />
          <div>
            <p className="text-sm font-semibold dash-text-bright">{t('s4FixedPerCreator')}</p>
            <p className="text-xs dash-text-muted">{t('s4FixedPerCreatorDesc')}</p>
          </div>
        </div>
      </div>

      {/* Payment method preference */}
      <div className={sectionClass}>
        <p className={sectionTitle}>{t('s4PaymentMethod')}</p>
        <p className="text-xs dash-text-muted mb-3">
          {t('s4PaymentMethodQ')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'card',  label: t('s4MethodCard'), desc: t('s4MethodCardDesc') },
            { value: 'ach',   label: t('s4MethodAch'),  desc: t('s4MethodAchDesc') },
            { value: 'both',  label: t('s4MethodBoth'), desc: t('s4MethodBothDesc') },
          ].map(opt => {
            const active = draft.preferred_payment_method === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('preferred_payment_method', opt.value)}
                className={`text-left p-3.5 rounded-lg border transition-all ${
                  active
                    ? 'border-[#99f7ff] bg-[rgba(153,247,255,0.08)] shadow-[0_0_12px_rgba(153,247,255,0.15)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${active ? 'text-[#99f7ff]' : 'dash-text-bright'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs dash-text-muted leading-snug">{opt.desc}</p>
              </button>
            )
          })}
        </div>

        {achSelected && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-red-400 leading-relaxed">
              <span className="font-semibold">{t('s4AchWarnTitle')}</span> {t('s4AchWarnDesc')}
            </p>
          </div>
        )}
        {showAchStartWarning && (
          <div className="mt-2 flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/8">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-amber-400 leading-relaxed">
              {t.rich('s4AchStartDesc', {
                date: format.dateTime(new Date(draft.start_date + 'T00:00:00'), 'monthDay'),
                b: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </p>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <p className={sectionTitle}>{t('s4Duration')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('s4StartDate')} <span className="text-[#99f7ff]">*</span></label>
            <NXDatePicker
              name="start_date_hidden"
              min={today}
              placeholder={t('s4StartPlaceholder')}
              onChange={val => set('start_date', val)}
            />
            {(() => {
              const tier = reputationTier as ReputationTier
              const cooldown = TIER_COOLDOWN_DAYS[tier]
              if (cooldown === null) {
                return <p className="mt-1 text-xs text-red-400">{t('s4SanctionedStart')}</p>
              }
              if (cooldown > 0) {
                return (
                  <p className="mt-1 text-xs text-[#a9abb5]">
                    {t.rich('s4CooldownStart', {
                      tier: tEnum(`tier.${tier}`),
                      n: cooldown,
                      b: (chunks) => <span className="text-[#99f7ff]">{chunks}</span>,
                    })}
                  </p>
                )
              }
              return null
            })()}
          </div>
          <div>
            <label className={labelClass}>{t('s4EndDate')} <span className="text-[#99f7ff]">*</span></label>
            <NXDatePicker
              name="end_date_hidden"
              min={draft.start_date || today}
              placeholder={t('s4EndPlaceholder')}
              onChange={val => set('end_date', val)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          {t('backArrow')}
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#99f7ff] text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity">
          {t('next')}
        </button>
      </div>
    </div>
  )
}
