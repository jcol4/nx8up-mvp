'use client'

import FormInput from '@/components/ui/FormInput'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle, CREATOR_TYPES, CREATOR_SIZES } from '../_shared'

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  onNext: () => void
  onBack: () => void
}

export default function Step3Creators({ draft, setDraft, onNext, onBack }: Props) {
  const toggleArr = (key: 'creator_types' | 'creator_sizes', val: string) =>
    setDraft(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(val)
        ? (prev[key] as string[]).filter(x => x !== val)
        : [...(prev[key] as string[]), val],
    }))

  return (
    <div className="space-y-6">
      {/* Creator type */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Who should promote this?</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CREATOR_TYPES.map(ct => {
            const active = draft.creator_types.includes(ct.value)
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => toggleArr('creator_types', ct.value)}
                className={`flex flex-col gap-1.5 p-4 rounded-lg border text-left transition-all duration-150 ${
                  active
                    ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_18px_rgba(0,200,255,0.12)]'
                    : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
                }`}
              >
                <p className={`text-sm font-semibold ${active ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                  {ct.label}
                </p>
                <p className="text-xs dash-text-muted leading-relaxed">{ct.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Creator size */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Creator Size</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CREATOR_SIZES.map(cs => {
            const active = draft.creator_sizes.includes(cs.value)
            return (
              <button
                key={cs.value}
                type="button"
                onClick={() => toggleArr('creator_sizes', cs.value)}
                className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all duration-150 ${
                  active
                    ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_14px_rgba(0,200,255,0.2)]'
                    : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
                }`}
              >
                <p className={`text-sm font-semibold ${active ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                  {cs.label}
                </p>
                <p className="text-xs dash-text-muted mt-0.5">{cs.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <p className={sectionTitle}>Requirements <span className="normal-case font-normal">(optional)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Minimum followers / subscribers</label>
            <FormInput
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={draft.min_subs_followers}
              onChange={e => setDraft(prev => ({ ...prev, min_subs_followers: e.target.value.replace(/[^\d]/g, '') }))}
              placeholder="e.g. 1000"
            />
          </div>
          <div>
            <label className={labelClass}>Minimum engagement rate (%)</label>
            <FormInput
              type="text"
              inputMode="decimal"
              variant="dashboard"
              value={draft.min_engagement_rate}
              onChange={e => setDraft(prev => ({ ...prev, min_engagement_rate: e.target.value.replace(/[^\d.]/g, '') }))}
              placeholder="e.g. 3.5"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          Next →
        </button>
      </div>
    </div>
  )
}
