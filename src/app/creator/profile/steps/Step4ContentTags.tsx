'use client'

import { useState } from 'react'
import NXStepper from '@/components/ui/NXStepper'
import FormInput from '@/components/ui/FormInput'
import {
  PLATFORM_OPTIONS,
  CONTENT_STYLE_OPTIONS,
  CONTENT_CATEGORY_OPTIONS,
  AUDIENCE_LOCATION_OPTIONS,
  AUDIENCE_GENDER_OPTIONS,
  labelClass,
  sectionTitle,
  toggleBtn,
  type CreatorProfileDraft,
} from '../_shared'

type Props = {
  draft: CreatorProfileDraft
  setDraft: React.Dispatch<React.SetStateAction<CreatorProfileDraft>>
  onNext: () => void
  onBack: () => void
  returnToSummary?: boolean
}

export default function Step4ContentTags({ draft, setDraft, onNext, onBack, returnToSummary }: Props) {
  const [gameTagInput, setGameTagInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  const toggle = (field: keyof CreatorProfileDraft, val: string) => {
    setDraft(d => {
      const arr = d[field] as string[]
      return {
        ...d,
        [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      }
    })
  }

  const addTag = (field: 'game_category' | 'audience_interests', value: string, clear: () => void) => {
    const t = value.trim()
    if (!t) return
    setDraft(d => {
      const arr = d[field]
      if (arr.includes(t)) return d
      return { ...d, [field]: [...arr, t] }
    })
    clear()
  }

  const removeTag = (field: 'game_category' | 'audience_interests', val: string) => {
    setDraft(d => ({ ...d, [field]: (d[field] as string[]).filter(x => x !== val) }))
  }

  return (
    <div className="space-y-5">
      {/* Platforms */}
      <div>
        <p className={sectionTitle}>Platforms</p>
        <p className="text-xs cr-text-muted mb-3">All platforms you create content on.</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => toggle('platform', p)}
              className={toggleBtn(draft.platform.includes(p))}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Game genres */}
      <div>
        <p className={sectionTitle}>Game Genres</p>
        <p className="text-xs cr-text-muted mb-2">Add tags (e.g. FPS, MOBA, RPG, Battle Royale).</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {draft.game_category.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm">
              {t}
              <button
                type="button"
                onClick={() => removeTag('game_category', t)}
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
            variant="creator"
            value={gameTagInput}
            onChange={e => setGameTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('game_category', gameTagInput, () => setGameTagInput('')))}
            placeholder="Add a game or genre..."
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => addTag('game_category', gameTagInput, () => setGameTagInput(''))}
            className="px-4 py-2.5 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Content style */}
      <div>
        <p className={sectionTitle}>Content Style</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_STYLE_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggle('content_style', s)}
              className={toggleBtn(draft.content_style.includes(s))}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content categories */}
      <div>
        <p className={sectionTitle}>Content Categories</p>
        <div className="flex flex-wrap gap-2">
          {CONTENT_CATEGORY_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => toggle('content_type', c)}
              className={toggleBtn(draft.content_type.includes(c))}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Audience interests */}
      <div>
        <p className={sectionTitle}>Audience Interests</p>
        <p className="text-xs cr-text-muted mb-2">Tags describing what your audience is into.</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {draft.audience_interests.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7b4fff]/20 text-[#c8dff0] text-sm">
              {t}
              <button
                type="button"
                onClick={() => removeTag('audience_interests', t)}
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
            variant="creator"
            value={interestInput}
            onChange={e => setInterestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('audience_interests', interestInput, () => setInterestInput('')))}
            placeholder="e.g. Esports, Tech, Anime..."
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => addTag('audience_interests', interestInput, () => setInterestInput(''))}
            className="px-4 py-2.5 rounded-lg bg-[#7b4fff]/20 text-[#c8dff0] text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Audience gender */}
      <div>
        <p className={sectionTitle}>Audience Gender</p>
        <p className="text-xs cr-text-muted mb-3">Primary gender makeup of your audience.</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_GENDER_OPTIONS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => toggle('audience_gender', g)}
              className={toggleBtn(draft.audience_gender.includes(g))}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Audience age range */}
      <div>
        <p className={sectionTitle}>Audience Age Range</p>
        <div className="flex items-center gap-3">
          <NXStepper
            value={draft.audience_age_min}
            onChange={v => setDraft(d => ({ ...d, audience_age_min: v }))}
            step={1} min={13} max={65} placeholder="13"
            className="w-36"
          />
          <span className="cr-text-muted text-sm">to</span>
          <NXStepper
            value={draft.audience_age_max}
            onChange={v => setDraft(d => ({ ...d, audience_age_max: v }))}
            step={1} min={13} max={65} placeholder="65"
            className="w-36"
          />
        </div>
        <p className="text-xs cr-text-muted mt-1.5">e.g. 18 to 34</p>
      </div>

      {/* Audience locations */}
      <div>
        <p className={sectionTitle}>Audience Locations</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_LOCATION_OPTIONS.map(loc => (
            <button
              key={loc}
              type="button"
              onClick={() => toggle('audience_locations', loc)}
              className={toggleBtn(draft.audience_locations.includes(loc))}
            >
              {loc}
            </button>
          ))}
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
