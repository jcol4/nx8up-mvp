/**
 * Step 3 — Creator Identity (profile wizard).
 *
 * Collects the creator's public-facing identity:
 *  - Display name (max 50 chars) and bio (max 500 chars).
 *  - Country / state / city — state dropdown appears only for US, Canada, UK.
 *  - Languages (multi-select toggle buttons).
 *  - Creator types (competitive gamer, streamer, content creator).
 *  - Primary platform (single-select; clicking again deselects).
 *
 * The "Save & Continue" button label switches to "Save Changes" when
 * `returnToSummary` is true (user arrived from the summary edit link).
 *
 * All field changes go through `setDraft` to keep the parent wizard state
 * in sync. `onNext` (which calls `saveAndContinue` in the wizard) is
 * responsible for persisting to the DB.
 */
'use client'

import FormInput from '@/components/ui/FormInput'
import FormTextarea from '@/components/ui/FormTextarea'
import FormSelect from '@/components/ui/FormSelect'
import {
  COUNTRIES,
  US_STATES,
  CA_PROVINCES,
  UK_NATIONS,
} from '@/lib/location-options'
import {
  CREATOR_TYPE_OPTIONS,
  PLATFORM_OPTIONS,
  COMMON_LANGUAGES,
  labelClass,
  sectionTitle,
  toggleBtn,
  type CreatorProfileDraft,
} from '../_shared'

function stateOptionsForCountry(country: string): readonly string[] {
  if (country === 'United States') return US_STATES
  if (country === 'Canada') return CA_PROVINCES
  if (country === 'United Kingdom') return UK_NATIONS
  return []
}

type Props = {
  draft: CreatorProfileDraft
  setDraft: React.Dispatch<React.SetStateAction<CreatorProfileDraft>>
  error?: string
  onNext: () => void
  onBack: () => void
  returnToSummary?: boolean
}

const sectionCardClass =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-4 sm:p-5'

export default function Step3CreatorIdentity({ draft, setDraft, error, onNext, onBack, returnToSummary }: Props) {
  /**
   * Generic toggle helper for array-type fields in the draft.
   * Adds `val` if absent, removes it if present.
   */
  const toggle = (field: keyof CreatorProfileDraft, val: string) => {
    setDraft(d => {
      const arr = d[field] as string[]
      return {
        ...d,
        [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Identity</p>
        <h2 className="mt-1 font-headline text-lg font-semibold text-[#e8f4ff]">Creator Identity</h2>
        <p className="mt-1 text-sm text-[#a9abb5]">
          Add your public profile details so sponsors can quickly understand who you are.
        </p>
      </div>

      <div className={sectionCardClass}>
        <p className={sectionTitle}>Identity Details</p>
        <p className="mb-4 text-xs text-[#a9abb5]">
          Add your public identity details so sponsors can quickly understand who you are and where your audience is.
        </p>

        {/* Display name */}
        <div>
          <label htmlFor="displayName" className={labelClass}>Display name</label>
          <FormInput
            id="displayName"
            type="text"
            variant="creator"
            value={draft.displayName}
            onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
            placeholder="How sponsors see you"
            maxLength={50}
          />
        </div>

        {/* Bio */}
        <div className="mt-4">
          <label htmlFor="bio" className={labelClass}>Bio</label>
          <FormTextarea
            id="bio"
            variant="creator"
            value={draft.bio}
            onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
            placeholder="Tell sponsors about your content and audience..."
            className="min-h-[100px]"
            maxLength={500}
            rows={3}
          />
        </div>

        {/* Location */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="country" className={labelClass}>Country</label>
            <FormSelect
              id="country"
              variant="creator"
              value={draft.country}
              onChange={e => setDraft(d => ({ ...d, country: e.target.value, state: '' }))}
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
          </div>
          {stateOptionsForCountry(draft.country).length > 0 && (
            <div>
              <label htmlFor="state" className={labelClass}>State / Province</label>
              <FormSelect
                id="state"
                variant="creator"
                value={draft.state}
                onChange={e => setDraft(d => ({ ...d, state: e.target.value }))}
              >
                <option value="">Select</option>
                {stateOptionsForCountry(draft.country).map(s => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
            </div>
          )}
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <FormInput
              id="city"
              type="text"
              variant="creator"
              value={draft.city}
              onChange={e => setDraft(d => ({ ...d, city: e.target.value }))}
              placeholder="City"
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>Languages</p>
        <p className="mb-3 text-xs text-[#a9abb5]">Select the languages you primarily create in.</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggle('language', lang)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                draft.language.includes(lang)
                  ? 'border-[#c084fc]/45 bg-[#c084fc]/20 text-[#e9d5ff] shadow-[0_0_12px_rgba(192,132,252,0.22)]'
                  : 'border-white/10 text-[#a9abb5] hover:border-[#c084fc]/35 hover:bg-[#c084fc]/8 hover:text-[#e8f4ff]'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Creator type */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>Creator Type</p>
        <p className="mb-3 text-xs text-[#a9abb5]">Select all that apply.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CREATOR_TYPE_OPTIONS.map(opt => {
            const active = draft.creator_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('creator_types', opt.value)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  active
                    ? 'border-[#99f7ff]/45 bg-[#99f7ff]/10 shadow-[0_0_14px_rgba(153,247,255,0.18)]'
                    : 'border-white/10 bg-black/20 hover:border-[#99f7ff]/30 hover:bg-[#99f7ff]/[0.04]'
                }`}
              >
                <div className={`mb-0.5 text-sm font-semibold ${active ? 'text-[#99f7ff]' : 'text-[#e8f4ff]'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-[#a9abb5]">{opt.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Primary platform */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>Primary Platform</p>
        <p className="mb-3 text-xs text-[#a9abb5]">Where do you create most of your content?</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setDraft(d => ({ ...d, primary_platform: d.primary_platform === p ? '' : p }))}
              className={toggleBtn(draft.primary_platform === p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

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
