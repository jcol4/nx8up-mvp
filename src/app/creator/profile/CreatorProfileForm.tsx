'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCreatorProfile, deleteCreatorProfile } from './_actions'
import type { CreatorProfile } from '@/lib/creator-profile'
import { suggestContentTypes } from '@/lib/creator-profile'
import {
  COUNTRIES,
  US_STATES,
  CA_PROVINCES,
  UK_NATIONS,
  CREATOR_PLATFORMS,
  COMMON_LANGUAGES,
} from '@/lib/location-options'

const AUDIENCE_LOCATION_OPTIONS = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Spain', 'Mexico', 'Brazil', 'Japan', 'South Korea', 'India',
  'Philippines', 'Indonesia', 'Netherlands', 'Sweden', 'Other',
] as const
import Alert from '@/components/ui/Alert'
import FormInput from '@/components/ui/FormInput'
import FormTextarea from '@/components/ui/FormTextarea'
import FormSelect from '@/components/ui/FormSelect'
import SecondaryButton from '@/components/ui/SecondaryButton'

type Props = {
  profile: CreatorProfile | null
  categoriesOptions: readonly string[]
  twitchBroadcasterType?: string | null
}

function stateOptionsForCountry(country: string): readonly string[] {
  if (country === 'United States') return US_STATES
  if (country === 'Canada') return CA_PROVINCES
  if (country === 'United Kingdom') return UK_NATIONS
  return []
}

export default function CreatorProfileForm({
  profile,
  categoriesOptions,
  twitchBroadcasterType,
}: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [categories, setCategories] = useState<string[]>(profile?.categories ?? [])
  const [country, setCountry] = useState(profile?.country ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [platform, setPlatform] = useState<string[]>(profile?.platform ?? [])
  const [gameTags, setGameTags] = useState<string[]>(profile?.game_category ?? [])
  const [gameTagInput, setGameTagInput] = useState('')
  const [language, setLanguage] = useState<string[]>(profile?.language ?? [])
  const [audienceAgeMin, setAudienceAgeMin] = useState<string>(profile?.audience_age_min?.toString() ?? '')
  const [audienceAgeMax, setAudienceAgeMax] = useState<string>(profile?.audience_age_max?.toString() ?? '')
  const [audienceLocations, setAudienceLocations] = useState<string[]>(profile?.audience_locations ?? [])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Twitch-derived suggestions
  const twitchContentSuggestions = suggestContentTypes(twitchBroadcasterType)
  const hasUnusedContentSuggestions = twitchContentSuggestions.some((c) => !categories.includes(c))

  const applyContentSuggestions = () => {
    setCategories((prev) => {
      const merged = [...prev]
      for (const c of twitchContentSuggestions) {
        if (!merged.includes(c)) merged.push(c)
      }
      return merged
    })
  }

  const toggleCategory = (cat: string) =>
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])

  const togglePlatform = (p: string) =>
    setPlatform((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  const addGameTag = () => {
    const t = gameTagInput.trim()
    if (t && !gameTags.includes(t)) {
      setGameTags((prev) => [...prev, t])
      setGameTagInput('')
    }
  }

  const removeGameTag = (t: string) => setGameTags((prev) => prev.filter((x) => x !== t))

  const toggleLanguage = (lang: string) =>
    setLanguage((prev) => prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang])

  const toggleAudienceLocation = (loc: string) =>
    setAudienceLocations((prev) => prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSaving(true)
    const res = await updateCreatorProfile({
      displayName,
      bio,
      categories,
      country,
      state,
      city,
      platform,
      game_category: gameTags,
      language,
      audience_age_min: audienceAgeMin ? parseInt(audienceAgeMin, 10) : undefined,
      audience_age_max: audienceAgeMax ? parseInt(audienceAgeMax, 10) : undefined,
      audience_locations: audienceLocations,
    })
    setIsSaving(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  const handleDelete = async () => {
    setError('')
    setIsDeleting(true)
    const res = await deleteCreatorProfile()
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (res.error) {
      setError(res.error)
    } else {
      setDisplayName('')
      setBio('')
      setCategories([])
      setCountry('')
      setState('')
      setCity('')
      setPlatform([])
      setGameTags([])
      setLanguage([])
      setAudienceAgeMin('')
      setAudienceAgeMax('')
      setAudienceLocations([])
      router.refresh()
    }
  }

  const labelClass = 'block text-sm font-medium cr-text-muted mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Profile saved successfully.</Alert>}

      {/* Display name */}
      <div>
        <label htmlFor="displayName" className={labelClass}>Display name</label>
        <FormInput
          id="displayName"
          type="text"
          variant="creator"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How sponsors see you"
          maxLength={50}
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="country" className={labelClass}>Country</label>
          <FormSelect
            id="country"
            variant="creator"
            value={country}
            onChange={(e) => { setCountry(e.target.value); setState('') }}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FormSelect>
        </div>
        {stateOptionsForCountry(country).length > 0 && (
          <div>
            <label htmlFor="state" className={labelClass}>State / Province / Region</label>
            <FormSelect
              id="state"
              variant="creator"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select</option>
              {stateOptionsForCountry(country).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FormSelect>
          </div>
        )}
        <div>
          <label htmlFor="city" className={labelClass}>City</label>
          <FormInput
            id="city"
            type="text"
            variant="creator"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
          />
        </div>
      </div>

      {/* Platform */}
      <div>
        <label className={labelClass}>Platform</label>
        <p className="text-xs cr-text-muted mb-2">Where do you create content?</p>
        <div className="flex flex-wrap gap-2">
          {CREATOR_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                platform.includes(p)
                  ? 'bg-[#00c8ff] text-black'
                  : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Games / Genres */}
      <div>
        <label className={labelClass}>Games / Genres</label>
        <p className="text-xs cr-text-muted mb-2">
          Add tags (e.g. FPS, MOBA, RPG). Press Enter or click Add.
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {gameTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm"
            >
              {t}
              <button
                type="button"
                onClick={() => removeGameTag(t)}
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
            onChange={(e) => setGameTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGameTag())}
            placeholder="Add a game or genre..."
            className="flex-1"
          />
          <button
            type="button"
            onClick={addGameTag}
            className="px-4 py-2.5 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className={labelClass}>Languages</label>
        <p className="text-xs cr-text-muted mb-2">Languages you create content in.</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                language.includes(lang)
                  ? 'bg-[#7b4fff]/30 text-[#c8dff0] border border-[#7b4fff]/50'
                  : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Audience demographics */}
      <div className="space-y-4 p-4 rounded-lg bg-white/[0.02] border border-white/5">
        <p className="text-xs font-medium cr-text-muted uppercase tracking-wider">Audience Demographics</p>
        <p className="text-xs cr-text-muted -mt-2">
          Help sponsors understand your audience. These are shown on campaign applications.
        </p>

        {/* Age range */}
        <div>
          <label className={labelClass}>Audience age range</label>
          <div className="flex items-center gap-3">
            <FormInput
              type="number"
              variant="creator"
              value={audienceAgeMin}
              onChange={(e) => setAudienceAgeMin(e.target.value)}
              placeholder="Min age"
              min={13}
              max={65}
              className="w-28"
            />
            <span className="cr-text-muted text-sm">to</span>
            <FormInput
              type="number"
              variant="creator"
              value={audienceAgeMax}
              onChange={(e) => setAudienceAgeMax(e.target.value)}
              placeholder="Max age"
              min={13}
              max={65}
              className="w-28"
            />
          </div>
          <p className="text-xs cr-text-muted mt-1.5">e.g. 18 to 34</p>
        </div>

        {/* Audience locations */}
        <div>
          <label className={labelClass}>Where is your audience mainly from?</label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_LOCATION_OPTIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => toggleAudienceLocation(loc)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  audienceLocations.includes(loc)
                    ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/40'
                    : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <FormTextarea
          id="bio"
          variant="creator"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell sponsors about your content and audience..."
          className="min-h-[100px]"
          maxLength={500}
          rows={4}
        />
      </div>

      {/* Content categories */}
      <div>
        <label className={labelClass}>Content categories</label>

        {twitchContentSuggestions.length > 0 && hasUnusedContentSuggestions && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-[#7b4fff]/10 border border-[#7b4fff]/30">
            <svg className="w-4 h-4 text-[#7b4fff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#c8dff0]">
                Suggested from Twitch: {twitchContentSuggestions.join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={applyContentSuggestions}
              className="text-xs text-[#7b4fff] hover:text-[#9b6fff] font-medium shrink-0 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categoriesOptions.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                categories.includes(cat)
                  ? 'bg-[#00c8ff] text-black'
                  : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
          className="py-2.5 px-5 rounded-lg cr-border border text-sm font-medium cr-text-muted hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-50"
        >
          Clear profile
        </button>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          aria-modal="true"
          role="dialog"
          aria-labelledby="clear-profile-title"
        >
          <div className="cr-panel max-w-sm w-full relative z-10 overflow-visible">
            <h3 id="clear-profile-title" className="cr-panel-title">Clear profile?</h3>
            <p className="text-sm cr-text-muted mb-4">
              This will remove all your profile info. You can add it again anytime.
            </p>
            <div className="flex gap-3">
              <SecondaryButton className="flex-1 min-w-0" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </SecondaryButton>
              <SecondaryButton
                variant="danger"
                className="flex-1 min-w-0"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Clearing...' : 'Clear'}
              </SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}