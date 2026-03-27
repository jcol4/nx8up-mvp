'use client'

import FormInput from '@/components/ui/FormInput'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle, TRACKING_TYPES, CONVERSION_GOALS } from '../_shared'

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  onNext: () => void
  onBack: () => void
}

export default function Step6Tracking({ draft, setDraft, onNext, onBack }: Props) {
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-6">
      {/* Landing page */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Landing Page</p>
        <div>
          <label className={labelClass}>URL</label>
          <FormInput
            type="url"
            variant="dashboard"
            value={draft.landing_page_url}
            onChange={e => set('landing_page_url', e.target.value)}
            placeholder="https://yoursite.com/landing"
          />
        </div>
      </div>

      {/* Tracking type */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Tracking Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TRACKING_TYPES.map(tt => (
            <button
              key={tt.value}
              type="button"
              onClick={() => set('tracking_type', tt.value)}
              className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all duration-150 ${
                draft.tracking_type === tt.value
                  ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_14px_rgba(0,200,255,0.15)]'
                  : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
              }`}
            >
              <p className={`text-sm font-semibold ${draft.tracking_type === tt.value ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                {tt.label}
              </p>
              <p className="text-xs dash-text-muted">{tt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Conversion goal */}
      <div className="space-y-3">
        <p className={sectionTitle}>Conversion Goal</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CONVERSION_GOALS.map(cg => (
            <button
              key={cg.value}
              type="button"
              onClick={() => set('conversion_goal', cg.value)}
              className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all duration-150 ${
                draft.conversion_goal === cg.value
                  ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_14px_rgba(0,200,255,0.15)]'
                  : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
              }`}
            >
              <p className={`text-sm font-semibold ${draft.conversion_goal === cg.value ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                {cg.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          Review →
        </button>
      </div>
    </div>
  )
}
