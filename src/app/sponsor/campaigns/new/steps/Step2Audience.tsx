/**
 * Step 2 — Audience
 *
 * Collects audience targeting criteria:
 * - Age range (min/max) via a custom AgeStepper component with +/− buttons.
 *   When `sponsorAgeRestriction` is set (18+ or 21+), the minimum selectable
 *   age is floored to the restriction value and a warning banner is shown.
 * - Gender targeting (multi-select: Male / Female / All).
 * - Required audience countries (multi-select from AUDIENCE_LOCATIONS).
 * - Target cities (free-text, optional).
 * - Target interests / game categories (free-text tag input with Enter/Add button).
 *
 * All fields are optional from a wizard-flow perspective (Step 2 has no
 * `validateStep` rules in the parent form).
 */
'use client'

import { useState } from 'react'
import FormInput from '@/components/ui/FormInput'
import type { CampaignDraft } from '../_shared'
import {
  labelClass, sectionClass, sectionTitle, toggleBtn,
  GENDERS, AUDIENCE_LOCATIONS,
} from '../_shared'

/**
 * AgeStepper — a number input with increment/decrement buttons, used for setting
 * the audience age range. Clamps the value to [min, max] on each interaction.
 * Accepts an empty string as a valid (unset) state.
 */
function AgeStepper({
  value,
  onChange,
  min = 13,
  max = 100,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  min?: number
  max?: number
  placeholder: string
}) {
  const num = parseInt(value, 10)
  const decrement = () => {
    if (!value) { onChange(String(max)); return }
    if (num > min) onChange(String(num - 1))
  }
  const increment = () => {
    if (!value) { onChange(String(min)); return }
    if (num < max) onChange(String(num + 1))
  }
  const btnClass =
    'w-8 h-8 flex items-center justify-center rounded-lg border dash-border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.35)] hover:bg-[rgba(0,200,255,0.05)] transition-all select-none shrink-0'

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={decrement} className={btnClass} aria-label="Decrease">
        <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
          <path d="M1 1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      <input
        type="number"
        value={value}
        onChange={e => {
          const v = e.target.value
          if (v === '') { onChange(''); return }
          const n = parseInt(v, 10)
          if (!isNaN(n) && n >= min && n <= max) onChange(String(n))
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-14 text-center px-2 py-1.5 rounded-lg border dash-border dash-bg-inner dash-text text-sm focus:outline-none focus:ring-1 focus:ring-[#00c8ff]/50 hover:border-[rgba(0,200,255,0.3)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" onClick={increment} className={btnClass} aria-label="Increase">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  onNext: () => void
  onBack: () => void
  sponsorAgeRestriction?: string | null
}

export default function Step2Audience({ draft, setDraft, onNext, onBack, sponsorAgeRestriction }: Props) {
  const [interestInput, setInterestInput] = useState('')
  const restrictionMinAge = sponsorAgeRestriction === '21+' ? 21 : sponsorAgeRestriction === '18+' ? 18 : 13

  const toggle = <K extends 'target_genders' | 'required_audience_locations' | 'target_interests'>(
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

        {sponsorAgeRestriction && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>
              Your profile has a <strong>{sponsorAgeRestriction}</strong> age restriction. The minimum audience age for all campaigns must be at least{' '}
              <strong>{restrictionMinAge}</strong>. You cannot market this product to audiences below this age.
            </span>
          </div>
        )}

        <div>
          <label className={labelClass}>Audience age range</label>
          <div className="flex items-center gap-3">
            <AgeStepper
              value={draft.audience_age_min}
              onChange={val => {
                const num = parseInt(val, 10)
                if (!isNaN(num) && num < restrictionMinAge) return
                setDraft(prev => ({ ...prev, audience_age_min: val }))
              }}
              placeholder="Min"
              min={restrictionMinAge}
            />
            <span className="dash-text-muted text-sm">to</span>
            <AgeStepper
              value={draft.audience_age_max}
              onChange={val => setDraft(prev => ({ ...prev, audience_age_max: val }))}
              placeholder="Max"
              min={restrictionMinAge}
            />
          </div>
          <p className="text-xs dash-text-muted mt-1.5">
            {sponsorAgeRestriction
              ? `Ages ${restrictionMinAge} – 100 (minimum enforced by your age restriction policy)`
              : 'Ages 13 – 100'}
          </p>
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
      </div>

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          Back
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          Next
        </button>
      </div>
    </div>
  )
}
