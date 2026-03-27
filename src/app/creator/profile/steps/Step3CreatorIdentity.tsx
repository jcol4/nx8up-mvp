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

export default function Step3CreatorIdentity({ draft, setDraft, error, onNext, onBack, returnToSummary }: Props) {
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
    <div className="space-y-5">
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
      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <FormTextarea
          id="bio"
          variant="creator"
          value={draft.bio}
          onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
          placeholder="Tell sponsors about your content and audience..."
          className="min-h-[90px]"
          maxLength={500}
          rows={3}
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Languages */}
      <div>
        <p className={sectionTitle}>Languages</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggle('language', lang)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                draft.language.includes(lang)
                  ? 'bg-[#7b4fff]/30 text-[#c8dff0] border-[#7b4fff]/50'
                  : 'border-white/10 text-[#3a5570] hover:text-[#c8dff0] hover:border-white/20'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Creator type */}
      <div>
        <p className={sectionTitle}>Creator Type</p>
        <p className="text-xs cr-text-muted mb-3">Select all that apply.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CREATOR_TYPE_OPTIONS.map(opt => {
            const active = draft.creator_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('creator_types', opt.value)}
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

      {/* Primary platform */}
      <div>
        <p className={sectionTitle}>Primary Platform</p>
        <p className="text-xs cr-text-muted mb-3">Where do you create most of your content?</p>
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
