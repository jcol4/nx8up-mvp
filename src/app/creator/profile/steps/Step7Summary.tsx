'use client'

import {
  CREATOR_TYPE_OPTIONS,
  PLATFORM_OPTIONS,
  PREFERRED_CAMPAIGN_TYPE_OPTIONS,
  PREFERRED_PRODUCT_TYPE_OPTIONS,
  type CreatorProfileDraft,
} from '../_shared'

type Props = {
  draft: CreatorProfileDraft
  onEditStep: (step: number) => void
  onFinish: () => void
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs cr-text-muted shrink-0">{label}</span>
      <span className="text-xs cr-text-bright text-right">{value}</span>
    </div>
  )
}

function Pills({ label, values, color = 'cyan' }: { label: string; values: string[]; color?: 'cyan' | 'purple' }) {
  if (!values.length) return null
  const chip = color === 'purple'
    ? 'text-[10px] px-1.5 py-0.5 rounded bg-[rgba(123,79,255,0.12)] text-[#a78bfa] border border-[rgba(123,79,255,0.25)]'
    : 'text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,200,255,0.1)] text-[#00c8ff] border border-[rgba(0,200,255,0.2)]'
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs cr-text-muted shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {values.map(v => <span key={v} className={chip}>{v}</span>)}
      </div>
    </div>
  )
}

function SectionHeader({ title, step, onEdit }: { title: string; step: number; onEdit: (s: number) => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest cr-text-muted">{title}</p>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="text-xs text-[#00c8ff] hover:opacity-80 transition-opacity"
      >
        Edit
      </button>
    </div>
  )
}

export default function Step7Summary({ draft, onEditStep, onFinish }: Props) {
  const creatorTypeLabels = CREATOR_TYPE_OPTIONS
    .filter(o => draft.creator_types.includes(o.value))
    .map(o => o.label)

  const campaignTypeLabels = PREFERRED_CAMPAIGN_TYPE_OPTIONS
    .filter(o => draft.preferred_campaign_types.includes(o.value))
    .map(o => o.label)

  const productTypeLabels = PREFERRED_PRODUCT_TYPE_OPTIONS
    .filter(o => draft.preferred_product_types.includes(o.value))
    .map(o => o.label)

  const locationStr = [draft.city, draft.state, draft.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-5">
      <p className="text-xs cr-text-muted">
        Your profile is complete. You can edit any section below, or head to your dashboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identity */}
        <div>
          <SectionHeader title="Identity" step={3} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Row label="Display name" value={draft.displayName || '—'} />
            <Row label="Location" value={locationStr || undefined} />
            <Pills label="Languages" values={draft.language} />
            <Pills label="Creator type" values={creatorTypeLabels} />
            <Row label="Primary platform" value={draft.primary_platform || undefined} />
            {draft.bio && (
              <div className="py-2 border-b border-white/5 last:border-0">
                <span className="text-xs cr-text-muted block mb-1">Bio</span>
                <span className="text-xs cr-text-bright leading-relaxed line-clamp-3">{draft.bio}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content & Audience */}
        <div>
          <SectionHeader title="Content & Audience" step={4} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Pills label="Platforms" values={draft.platform} />
            <Pills label="Game genres" values={draft.game_category} />
            <Pills label="Content style" values={draft.content_style} />
            <Pills label="Categories" values={draft.content_type} />
            <Pills label="Audience interests" values={draft.audience_interests} color="purple" />
            {(draft.audience_age_min || draft.audience_age_max) && (
              <Row
                label="Audience age"
                value={[draft.audience_age_min, draft.audience_age_max].filter(Boolean).join(' – ')}
              />
            )}
            <Pills label="Audience locations" values={draft.audience_locations} />
          </div>
        </div>

        {/* Brand preferences */}
        <div>
          <SectionHeader title="Brand Preferences" step={5} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Pills label="Campaign types" values={campaignTypeLabels} />
            <Pills label="Product types" values={productTypeLabels} color="purple" />
            {!campaignTypeLabels.length && !productTypeLabels.length && (
              <p className="text-xs cr-text-muted italic py-2">No preferences set</p>
            )}
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <SectionHeader title="Eligibility" step={6} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Row
              label="Availability"
              value={draft.is_available ? 'Available' : 'Not available'}
            />
            <Row
              label="Max campaigns / month"
              value={draft.max_campaigns_per_month || 'No limit'}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onFinish}
          className="py-2.5 px-7 rounded-lg bg-[#00c8ff] text-black text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,200,255,0.2)]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
