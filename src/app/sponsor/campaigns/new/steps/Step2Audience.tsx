'use client'

import { useState } from 'react'
import FormInput from '@/components/ui/FormInput'
import type { CampaignDraft } from '../_shared'
import {
  labelClass, sectionClass, sectionTitle, toggleBtn,
  AGE_RANGES, GENDERS, AUDIENCE_LOCATIONS,
} from '../_shared'

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  onNext: () => void
  onBack: () => void
}

export default function Step2Audience({ draft, setDraft, onNext, onBack }: Props) {
  const [interestInput, setInterestInput] = useState('')

  const toggle = <K extends 'target_age_ranges' | 'target_genders' | 'required_audience_locations' | 'target_interests'>(
    key: K,
    val: string
  ) => setDraft(prev => ({
    ...prev,
    [key]: (prev[key] as string[]).includes(val)
      ? (prev[key] as string[]).filter(x => x !== val)
      : [...(prev[key] as string[]), val],
  }))

  const addInterest = () => {
    const t = interestInput.trim()
    if (t && !draft.target_interests.includes(t)) {
      setDraft(prev => ({ ...prev, target_interests: [...prev.target_interests, t] }))
      setInterestInput('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Age */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Who are you trying to reach?</p>

        <div>
          <label className={labelClass}>Age range</label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map(r => (
              <button key={r} type="button" onClick={() => toggle('target_age_ranges', r)} className={toggleBtn(draft.target_age_ranges.includes(r))}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Gender</label>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(g => (
              <button key={g} type="button" onClick={() => toggle('target_genders', g)} className={toggleBtn(draft.target_genders.includes(g))}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Location</p>

        <div>
          <label className={labelClass}>Countries</label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_LOCATIONS.map(loc => (
              <button key={loc} type="button" onClick={() => toggle('required_audience_locations', loc)} className={toggleBtn(draft.required_audience_locations.includes(loc))}>
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Cities <span className="font-normal dash-text-muted">(optional)</span></label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.target_cities}
            onChange={e => setDraft(prev => ({ ...prev, target_cities: e.target.value }))}
            placeholder="e.g. Los Angeles, New York, London"
          />
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <p className={sectionTitle}>Interests</p>
        <p className="text-xs dash-text-muted -mt-2">Topics your ideal audience is passionate about.</p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {draft.target_interests.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm">
              {t}
              <button
                type="button"
                onClick={() => toggle('target_interests', t)}
                className="hover:text-red-400 transition-colors"
                aria-label={`Remove ${t}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <FormInput
            type="text"
            variant="dashboard"
            value={interestInput}
            onChange={e => setInterestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
            placeholder="e.g. FPS gaming, esports, fitness, streetwear"
            className="flex-1"
          />
          <button
            type="button"
            onClick={addInterest}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border dash-border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.35)] hover:bg-[rgba(0,200,255,0.05)]"
          >
            Add
          </button>
        </div>

        <p className="text-xs dash-text-muted">
          Examples: FPS gaming · esports · casual gaming · fitness · streetwear
        </p>
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
