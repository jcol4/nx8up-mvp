'use client'

import {
  PREFERRED_CAMPAIGN_TYPE_OPTIONS,
  PREFERRED_PRODUCT_TYPE_OPTIONS,
  sectionTitle,
  type CreatorProfileDraft,
} from '../_shared'

type Props = {
  draft: CreatorProfileDraft
  setDraft: React.Dispatch<React.SetStateAction<CreatorProfileDraft>>
  onNext: () => void
  onBack: () => void
  returnToSummary?: boolean
}

export default function Step5BrandPreferences({ draft, setDraft, onNext, onBack, returnToSummary }: Props) {
  const toggle = (field: 'preferred_campaign_types' | 'preferred_product_types', val: string) => {
    setDraft(d => {
      const arr = d[field]
      return {
        ...d,
        [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Preferred campaign types */}
      <div>
        <p className={sectionTitle}>Preferred Campaign Types</p>
        <p className="text-xs cr-text-muted mb-3">What kinds of sponsorship formats work best for your content?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREFERRED_CAMPAIGN_TYPE_OPTIONS.map(opt => {
            const active = draft.preferred_campaign_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('preferred_campaign_types', opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  active
                    ? 'border-[#00c8ff]/50 bg-[#00c8ff]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className={`text-sm font-semibold mb-0.5 ${active ? 'text-[#00c8ff]' : 'cr-text-bright'}`}>
                  {opt.label}
                </div>
                <div className="text-xs cr-text-muted">{opt.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Preferred product types */}
      <div>
        <p className={sectionTitle}>Preferred Product Types</p>
        <p className="text-xs cr-text-muted mb-3">What sponsor categories are you comfortable promoting?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREFERRED_PRODUCT_TYPE_OPTIONS.map(opt => {
            const active = draft.preferred_product_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('preferred_product_types', opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  active
                    ? 'border-[#7b4fff]/50 bg-[#7b4fff]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className={`text-sm font-semibold mb-0.5 ${active ? 'text-[#a78bfa]' : 'cr-text-bright'}`}>
                  {opt.label}
                </div>
                <div className="text-xs cr-text-muted">{opt.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-5 rounded-lg border border-white/10 cr-text-muted text-sm font-medium hover:text-[#c8dff0] hover:border-white/20 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {returnToSummary ? 'Save Changes' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
