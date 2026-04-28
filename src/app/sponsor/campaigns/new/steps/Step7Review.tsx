'use client'

import type { CampaignDraft } from '../_shared'
import { PRODUCT_TYPES, OBJECTIVES, MISSION_TYPES, TRACKING_TYPES, CONVERSION_GOALS, CREATOR_TYPES, CREATOR_SIZES } from '../_shared'
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
          <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(153,247,255,0.1)] text-[#99f7ff] border border-[rgba(153,247,255,0.22)]">{v}</span>
        ))}
      </div>
    </div>
  )
}

export default function Step7Review({ draft, error, isSubmitting, onSubmit, onBack }: Props) {
  const budgetNum = parseInt(draft.budget, 10) || 0
  const creatorCount = draft.creator_count ? parseInt(draft.creator_count, 10) : null
  const { fee, creatorPool, perCreator } = calcFeeBreakdown(budgetNum, creatorCount)

  const objective = OBJECTIVES.find(o => o.value === draft.objective) as { value: string; label: string; description: string } | undefined
  const productType = PRODUCT_TYPES.find(p => p.value === draft.product_type)
  const missionType = MISSION_TYPES.find(m => m.value === draft.campaign_type)
  const trackingType = TRACKING_TYPES.find(t => t.value === draft.tracking_type)
  const conversionGoal = CONVERSION_GOALS.find(c => c.value === draft.conversion_goal)
  const creatorTypeLabels = CREATOR_TYPES.filter(c => draft.creator_types.includes(c.value)).map(c => c.label)
  const creatorSizeLabels = CREATOR_SIZES.filter(c => draft.creator_sizes.includes(c.value)).map(c => `${c.label} (${c.description})`)

  return (
    <div className="space-y-5">
      <p className="text-xs text-[#a9abb5]">Review your campaign before launching. You can go back to edit any section.</p>

      {/* Campaign summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Column 1 */}
        <div>
          <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">Campaign</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <Row label="Name" value={draft.title || '—'} />
            <Row label="Brand" value={draft.brand_name || '—'} />
            <Row label="Product" value={draft.product_name || '—'} />
            <Row label="Product type" value={productType?.label} />
            <Row label="Goal" value={objective?.label} />
            <Pills label="Platforms" values={draft.platform} />
          </div>
        </div>

        {/* Column 2 */}
        <div>
          <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">Audience</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            {(draft.audience_age_min || draft.audience_age_max) && (
              <Row
                label="Audience age"
                value={[draft.audience_age_min, draft.audience_age_max].filter(Boolean).join(' – ')}
              />
            )}
            <Pills label="Gender" values={draft.target_genders} />
            <Pills label="Countries" values={draft.required_audience_locations} />
            <Row label="Cities" value={draft.target_cities || undefined} />
            <Pills label="Interests" values={draft.target_interests} />
          </div>
        </div>

        {/* Column 3 */}
        <div>
          <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">Creators</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <Pills label="Type" values={creatorTypeLabels} />
            <Pills label="Size" values={creatorSizeLabels} />
            <Row label="Min. followers" value={draft.min_subs_followers || undefined} />
            <Row label="Min. CTR" value={draft.min_engagement_rate ? `${draft.min_engagement_rate}%` : undefined} />
          </div>
        </div>

        {/* Column 4 */}
        <div>
          <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-2">Deliverables</p>
          <div className="rounded-lg border border-white/10 bg-black/25 p-3">
            <Row label="Mission type" value={missionType?.label} />
            {draft.num_videos && <Row label="YT videos" value={draft.num_videos} />}
            {draft.num_streams && <Row label="Streams" value={draft.num_streams} />}
            {draft.min_stream_duration && <Row label="Min. stream (min)" value={draft.min_stream_duration} />}
            {draft.num_posts && <Row label="Posts" value={draft.num_posts} />}
            {draft.num_short_videos && <Row label="Short videos" value={draft.num_short_videos} />}
            {draft.must_include_link && <Row label="Link required" value="Yes" />}
            {draft.must_include_promo_code && <Row label="Promo code required" value="Yes" />}
            {draft.must_tag_brand && <Row label="Tag brand required" value="Yes" />}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="rounded-lg border border-white/10 bg-black/25 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Row label="Start date" value={draft.start_date} />
        <Row label="End date" value={draft.end_date} />
        <Row label="Creators" value={draft.creator_count || undefined} />
        <Row label="Tracking" value={trackingType?.label} />
      </div>

      {/* Budget breakdown */}
      <div className="rounded-lg border border-white/10 bg-black/25 p-4">
        <p className="font-headline text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99f7ff] mb-4">Budget Breakdown</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#a9abb5]">Total Campaign Budget</span>
            <span className="text-sm font-semibold text-[#e8f4ff]">
              ${budgetNum > 0 ? budgetNum.toLocaleString() : '—'}
            </span>
          </div>
          {budgetNum > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a9abb5]">nx8up Fee (10%)</span>
                <span className="text-sm text-red-400">−${fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-sm font-semibold text-[#e8f4ff]">Creator Payout Pool</span>
                <span className="text-sm font-bold text-[#22c55e]">${creatorPool.toLocaleString()}</span>
              </div>
              {perCreator && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#a9abb5]">Per creator ({draft.creator_count} creators)</span>
                  <span className="text-xs font-semibold text-[#22c55e]">≈ ${perCreator.toLocaleString()}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversion goal */}
      {conversionGoal && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/20">
          <div>
            <p className="text-xs text-[#a9abb5]">Conversion goal</p>
            <p className="text-sm font-semibold text-[#e8f4ff]">{conversionGoal.label}</p>
          </div>
        </div>
      )}

      {/* Escrow notice */}
      <div className="flex gap-3 p-4 rounded-lg bg-[rgba(153,247,255,0.06)] border border-[rgba(153,247,255,0.18)]">
        <svg className="w-5 h-5 text-[#99f7ff] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs text-[#a9abb5] leading-relaxed">
          Funds are held securely by nx8up and released to creators upon verified campaign completion.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-between pt-2 border-t border-white/10">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border border-white/10 text-[#a9abb5] text-sm font-medium hover:text-[#e8f4ff] transition-colors">
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="py-2.5 px-7 rounded-lg bg-[#99f7ff] text-slate-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_20px_rgba(153,247,255,0.28)]"
        >
          {isSubmitting ? 'Launching...' : 'Launch Campaign'}
        </button>
      </div>
    </div>
  )
}
