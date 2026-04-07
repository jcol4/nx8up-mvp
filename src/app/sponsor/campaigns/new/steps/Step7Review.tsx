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
      <span className="text-xs dash-text-muted shrink-0">{label}</span>
      <span className="text-xs dash-text-bright text-right">{value}</span>
    </div>
  )
}

function Pills({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs dash-text-muted shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {values.map(v => (
          <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,200,255,0.1)] text-[#00c8ff] border border-[rgba(0,200,255,0.2)]">{v}</span>
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
      <p className="text-xs dash-text-muted">Review your campaign before launching. You can go back to edit any section.</p>

      {/* Campaign summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Column 1 */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest dash-text-muted mb-2">Campaign</p>
          <div className="dash-panel p-3">
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
          <p className="text-[10px] font-semibold uppercase tracking-widest dash-text-muted mb-2">Audience</p>
          <div className="dash-panel p-3">
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
          <p className="text-[10px] font-semibold uppercase tracking-widest dash-text-muted mb-2">Creators</p>
          <div className="dash-panel p-3">
            <Pills label="Type" values={creatorTypeLabels} />
            <Pills label="Size" values={creatorSizeLabels} />
            <Row label="Min. followers" value={draft.min_subs_followers || undefined} />
            <Row label="Min. engagement" value={draft.min_engagement_rate ? `${draft.min_engagement_rate}%` : undefined} />
          </div>
        </div>

        {/* Column 4 */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest dash-text-muted mb-2">Deliverables</p>
          <div className="dash-panel p-3">
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
      <div className="dash-panel p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Row label="Start date" value={draft.start_date} />
        <Row label="End date" value={draft.end_date} />
        <Row label="Creators" value={draft.creator_count || undefined} />
        <Row label="Tracking" value={trackingType?.label} />
      </div>

      {/* Budget breakdown */}
      <div className="dash-panel p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest dash-text-muted mb-4">Budget Breakdown</p>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm dash-text-muted">Total Campaign Budget</span>
            <span className="text-sm font-semibold dash-text-bright">
              ${budgetNum > 0 ? budgetNum.toLocaleString() : '—'}
            </span>
          </div>
          {budgetNum > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm dash-text-muted">nx8up Fee (10%)</span>
                <span className="text-sm text-red-400">−${fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t dash-border">
                <span className="text-sm font-semibold dash-text-bright">Creator Payout Pool</span>
                <span className="text-sm font-bold text-[#22c55e]">${creatorPool.toLocaleString()}</span>
              </div>
              {perCreator && (
                <div className="flex justify-between items-center">
                  <span className="text-xs dash-text-muted">Per creator ({draft.creator_count} creators)</span>
                  <span className="text-xs font-semibold text-[#22c55e]">≈ ${perCreator.toLocaleString()}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversion goal */}
      {conversionGoal && (
        <div className="flex items-center gap-3 p-3 rounded-lg border dash-border">
          <div>
            <p className="text-xs dash-text-muted">Conversion goal</p>
            <p className="text-sm font-semibold dash-text-bright">{conversionGoal.label}</p>
          </div>
        </div>
      )}

      {/* Escrow notice */}
      <div className="flex gap-3 p-4 rounded-lg bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.15)]">
        <svg className="w-5 h-5 text-[#00c8ff] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-xs dash-text-muted leading-relaxed">
          Funds are held securely by nx8up and released to creators upon verified campaign completion.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="py-2.5 px-7 rounded-lg bg-[#00c8ff] text-black text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[0_0_20px_rgba(0,200,255,0.3)]"
        >
          {isSubmitting ? 'Launching...' : 'Launch Campaign'}
        </button>
      </div>
    </div>
  )
}
