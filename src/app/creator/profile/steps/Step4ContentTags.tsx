/**
 * Step 4 — Content & Audience Tags (profile wizard).
 *
 * Collects content classification and audience demographic data:
 *  - Platforms (multi-select, all platforms the creator is active on).
 *  - Game genres (free-form tags; Enter or "Add" button to append).
 *  - Content style (multi-select: Educational, Entertaining, etc.).
 *  - Content categories (multi-select: Gaming, Vlogging, etc.).
 *  - Audience interests (free-form tags).
 *  - Audience gender (multi-select: Male / Female / Mixed).
 *  - Audience age range (min/max stepper inputs, 13–65).
 *  - Audience locations (multi-select from a predefined country list).
 *
 * Free-form tag inputs (game genres, audience interests) maintain their own
 * local state and are committed to the draft on "Add" or Enter.
 */
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

const sectionCardClass =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-4 sm:p-5'

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
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Content</p>
        <h2 className="mt-1 font-headline text-lg font-semibold text-[#e8f4ff]">Content & Audience Tags</h2>
        <p className="mt-1 text-sm text-[#a9abb5]">
          Define your platforms, content themes, and audience profile for better campaign matching.
        </p>
      </div>

      <div className={sectionCardClass}>
        {/* Platforms */}
        <div>
          <p className={sectionTitle}>Platforms</p>
          <p className="mb-3 text-xs text-[#a9abb5]">All platforms you create content on.</p>
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
        <div className="mt-5">
          <p className={sectionTitle}>Game Genres</p>
          <p className="mb-2 text-xs text-[#a9abb5]">Add tags (e.g. FPS, MOBA, RPG, Battle Royale).</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {draft.game_category.map(t => (
              <span key={t} className="inline-flex items-center gap-1 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/12 px-2.5 py-1 text-sm text-[#99f7ff]">
                {t}
                <button
                  type="button"
                  onClick={() => removeTag('game_category', t)}
                  className="transition-colors hover:text-red-400"
                  aria-label={`Remove ${t}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="shrink-0 rounded-lg bg-[#99f7ff]/15 px-4 py-2.5 text-sm font-medium text-[#99f7ff] transition-colors hover:bg-[#99f7ff]/20"
            >
              Add
            </button>
          </div>
        </div>

        {/* Content style */}
        <div className="mt-5">
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
        <div className="mt-5">
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
      </div>

      <div className={sectionCardClass}>
        {/* Audience interests */}
        <div>
          <p className={sectionTitle}>Audience Interests</p>
          <p className="mb-2 text-xs text-[#a9abb5]">Tags describing what your audience is into.</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {draft.audience_interests.map(t => (
              <span key={t} className="inline-flex items-center gap-1 rounded-lg border border-[#c084fc]/35 bg-[#c084fc]/15 px-2.5 py-1 text-sm text-[#e9d5ff]">
                {t}
                <button
                  type="button"
                  onClick={() => removeTag('audience_interests', t)}
                  className="transition-colors hover:text-red-400"
                  aria-label={`Remove ${t}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="shrink-0 rounded-lg bg-[#c084fc]/20 px-4 py-2.5 text-sm font-medium text-[#e9d5ff] transition-colors hover:bg-[#c084fc]/26"
            >
              Add
            </button>
          </div>
        </div>

        {/* Audience gender */}
        <div className="mt-5">
          <p className={sectionTitle}>Audience Gender</p>
          <p className="mb-3 text-xs text-[#a9abb5]">Primary gender makeup of your audience.</p>
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
        <div className="mt-5">
          <p className={sectionTitle}>Audience Age Range</p>
          <div className="flex items-center gap-3">
            <NXStepper
              value={draft.audience_age_min}
              onChange={v => setDraft(d => ({ ...d, audience_age_min: v }))}
              step={1} min={13} max={65} placeholder="13"
              className="w-36"
            />
            <span className="text-sm text-[#a9abb5]">to</span>
            <NXStepper
              value={draft.audience_age_max}
              onChange={v => setDraft(d => ({ ...d, audience_age_max: v }))}
              step={1} min={13} max={65} placeholder="65"
              className="w-36"
            />
          </div>
          <p className="mt-1.5 text-xs text-[#a9abb5]">e.g. 18 to 34</p>
        </div>

        {/* Audience locations */}
        <div className="mt-5">
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
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-[#99f7ff] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90"
        >
          {returnToSummary ? 'Save Changes' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
