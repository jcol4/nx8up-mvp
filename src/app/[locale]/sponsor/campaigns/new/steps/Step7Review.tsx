'use client'

import { useTranslations, useFormatter } from 'next-intl'
import type { CampaignDraft } from '../_shared'
import { CREATOR_TYPES, CREATOR_SIZES } from '../_shared'
import { NX_FEE_RATE, calcFeeBreakdown } from '@/lib/constants'

type Props = {
  draft: CampaignDraft
  error: string
  isSubmitting: boolean
  onSubmit: () => void
  onBack: () => void
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-[#a9abb5] shrink-0">{label}</span>
      <span className="text-xs text-[#e8f4ff] text-right">{value}</span>
    </div>
  )
}

function Pills({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-[#a9abb5] shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {values.map(v => (
          <span key={v} className="text-nx-10 px-1.5 py-0.5 rounded bg-[rgba(153,247,255,0.1)] text-[#99f7ff] border border-[rgba(153,247,255,0.22)]">{v}</span>
        ))}
      </div>
    </div>
  )
}

export default function Step7Review({ draft, error, isSubmitting, onSubmit, onBack }: Props) {
  const t = useTranslations('sponsor.campaignWizard')
  const tEnum = useTranslations('enums')
  const format = useFormatter()
  const budgetNum = parseInt(draft.budget, 10) || 0
  const creatorCount = draft.creator_count ? parseInt(draft.creator_count, 10) : null
  const { fee, creatorPool, perCreator } = calcFeeBreakdown(budgetNum, creatorCount)

  const objectiveLabel = draft.objective ? tEnum(`objective.${draft.objective}.label`) : undefined
  const productTypeLabel = draft.product_type ? tEnum(`productType.${draft.product_type}.label`) : undefined
  const missionTypeLabel = draft.campaign_type ? tEnum(`missionType.${draft.campaign_type}.label`) : undefined
  const trackingTypeLabel = draft.tracking_type ? tEnum(`trackingType.${draft.tracking_type}.label`) : undefined
  const conversionGoalLabel = draft.conversion_goal ? tEnum(`conversionGoal.${draft.conversion_goal}`) : undefined
  const creatorTypeLabels = CREATOR_TYPES.filter(c => draft.creator_types.includes(c.value)).map(c => tEnum(`targetCreatorType.${c.value}.label`))
  const creatorSizeLabels = CREATOR_SIZES.filter(c => draft.creator_sizes.includes(c.value)).map(c => `${tEnum(`creatorSize.${c.value}.label`)} (${tEnum(`creatorSize.${c.value}.desc`)})`)

  return (
    <div className="space-y-5">
      <p className="text-xs text-[#a9abb5]">{t('s7Intro')}</p>

      {/* Campaign summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Column 1 */}
        <div>
          <p className="font-headline text-nx-10 font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">{t('s7Campaign')}</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <Row label={t('s7Name')} value={draft.title || '—'} />
            <Row label={t('s7Brand')} value={draft.brand_name || '—'} />
            <Row label={t('s7Product')} value={draft.product_name || '—'} />
            <Row label={t('s7ProductType')} value={productTypeLabel} />
            <Row label={t('s7Goal')} value={objectiveLabel} />
            <Pills label={t('s7Platforms')} values={draft.platform} />
          </div>
        </div>

        {/* Column 2 */}
        <div>
          <p className="font-headline text-nx-10 font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">{t('s7Audience')}</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            {(draft.audience_age_min || draft.audience_age_max) && (
              <Row
                label={t('s7AudienceAge')}
                value={[draft.audience_age_min, draft.audience_age_max].filter(Boolean).join(' – ')}
              />
            )}
            <Pills label={t('s7Gender')} values={draft.target_genders} />
            <Pills label={t('s7Countries')} values={draft.required_audience_locations} />
            <Row label={t('s7Cities')} value={draft.target_cities || undefined} />
            <Pills label={t('s7Interests')} values={draft.target_interests} />
          </div>
        </div>

        {/* Column 3 */}
        <div>
          <p className="font-headline text-nx-10 font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">{t('s7Creators')}</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <Pills label={t('s7Type')} values={creatorTypeLabels} />
            <Pills label={t('s7Size')} values={creatorSizeLabels} />
            <Row label={t('s7MinFollowers')} value={draft.min_subs_followers || undefined} />
            <Row label={t('s7MinCtr')} value={draft.min_engagement_rate ? `${draft.min_engagement_rate}%` : undefined} />
          </div>
        </div>

        {/* Column 4 */}
        <div>
          <p className="font-headline text-nx-10 font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">{t('s7Deliverables')}</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <Row label={t('s7MissionType')} value={missionTypeLabel} />
            {draft.num_videos && <Row label={t('s7YtVideos')} value={draft.num_videos} />}
            {draft.num_streams && <Row label={t('s7Streams')} value={draft.num_streams} />}
            {draft.min_stream_duration && <Row label={t('s7MinStream')} value={draft.min_stream_duration} />}
            {draft.num_posts && <Row label={t('s7Posts')} value={draft.num_posts} />}
            {draft.num_short_videos && <Row label={t('s7ShortVideos')} value={draft.num_short_videos} />}
            {draft.must_include_link && <Row label={t('s7LinkRequired')} value={t('s7Yes')} />}
            {draft.must_include_promo_code && <Row label={t('s7PromoRequired')} value={t('s7Yes')} />}
            {draft.must_tag_brand && <Row label={t('s7TagRequired')} value={t('s7Yes')} />}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="rounded-lg border border-white/10 bg-black/25 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Row label={t('s4StartDate')} value={draft.start_date} />
        <Row label={t('s4EndDate')} value={draft.end_date} />
        <Row label={t('s7CreatorsCount')} value={draft.creator_count || undefined} />
        <Row label={t('s7Tracking')} value={trackingTypeLabel} />
      </div>

      {/* Budget breakdown */}
      <div className="rounded-lg border border-white/10 bg-black/25 p-4">
        <p className="font-headline text-nx-10 font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-4">{t('s7BudgetBreakdown')}</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#a9abb5]">{t('s7TotalBudget')}</span>
            <span className="text-sm font-semibold text-[#e8f4ff]">
              ${budgetNum > 0 ? format.number(budgetNum) : '—'}
            </span>
          </div>
          {budgetNum > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a9abb5]">{t('feeLabel', { pct: Math.round(NX_FEE_RATE * 100) })}</span>
                <span className="text-sm text-red-400">−${format.number(fee)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-sm font-semibold text-[#e8f4ff]">{t('creatorPoolLabel')}</span>
                <span className="text-sm font-bold text-[#22c55e]">${format.number(creatorPool)}</span>
              </div>
              {perCreator && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a9abb5]">{t('s7PerCreator', { n: draft.creator_count })}</span>
                  <span className="text-xs font-semibold text-[#22c55e]">≈ ${format.number(perCreator)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversion goal */}
      {conversionGoalLabel && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/20">
          <div>
            <p className="text-xs text-[#a9abb5]">{t('s7ConversionGoal')}</p>
            <p className="text-sm font-semibold text-[#e8f4ff]">{conversionGoalLabel}</p>
          </div>
        </div>
      )}

      {/* Escrow notice */}
      <div className="flex gap-3 p-4 rounded-lg bg-[rgba(153,247,255,0.06)] border border-[rgba(153,247,255,0.18)]">
        <svg className="w-5 h-5 text-[#99f7ff] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs text-[#a9abb5] leading-relaxed">
          {t('s7EscrowNotice')}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-between pt-2 border-t border-white/10">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border border-white/10 text-[#a9abb5] text-sm font-medium hover:text-[#e8f4ff] transition-colors">
          {t('backArrow')}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="py-2.5 px-7 rounded-lg bg-[#99f7ff] text-slate-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_20px_rgba(153,247,255,0.28)]"
        >
          {isSubmitting ? t('s7Launching') : t('s7Launch')}
        </button>
      </div>
    </div>
  )
}
