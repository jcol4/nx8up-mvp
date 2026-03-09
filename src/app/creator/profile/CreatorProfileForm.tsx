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

export default function CreatorProfileForm({ profile, categoriesOptions, twitchBroadcasterType }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [categories, setCategories] = useState<string[]>(profile?.categories ?? [])
  const [urls, setUrls] = useState<{ label?: string; url: string }[]>(
    profile?.urls?.length ? profile.urls : [{ url: '' }]
  )
  const [country, setCountry] = useState(profile?.country ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [platform, setPlatform] = useState<string[]>(profile?.platform ?? [])
  const [gameTags, setGameTags] = useState<string[]>(
    // Seed from game_category if set, otherwise fall back to most_played_games from Twitch
    profile?.game_category?.length
      ? profile.game_category
      : (profile?.most_played_games ?? [])
  )
  const [averageViewers, setAverageViewers] = useState<number | ''>(profile?.average_viewers ?? '')
  const [subsFollowers, setSubsFollowers] = useState<number | ''>(profile?.subs_followers ?? '')
  const twitchSynced = !!twitchBroadcasterType
  const [gameTagInput, setGameTagInput] = useState('')
  const [language, setLanguage] = useState<string[]>(profile?.language ?? [])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Twitch-derived suggestions
  const twitchGameSuggestions = profile?.most_played_games ?? []
  const twitchContentSuggestions = suggestContentTypes(twitchBroadcasterType)
  const hasUnusedGameSuggestions = twitchGameSuggestions.some((g) => !gameTags.includes(g))
  const hasUnusedContentSuggestions = twitchContentSuggestions.some((c) => !categories.includes(c))

  const applyGameSuggestions = () => {
    setGameTags((prev) => {
      const merged = [...prev]
      for (const g of twitchGameSuggestions) {
        if (!merged.includes(g)) merged.push(g)
      }
      return merged
    })
  }

  const applyContentSuggestions = () => {
    setCategories((prev) => {
      const merged = [...prev]
      for (const c of twitchContentSuggestions) {
        if (!merged.includes(c)) merged.push(c)
      }
      return merged
    })
  }

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const togglePlatform = (p: string) => {
    setPlatform((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  const addGameTag = () => {
    const t = gameTagInput.trim()
    if (t && !gameTags.includes(t)) {
      setGameTags((prev) => [...prev, t])
      setGameTagInput('')
    }
  }

  const removeGameTag = (t: string) => {
    setGameTags((prev) => prev.filter((x) => x !== t))
  }

  const toggleLanguage = (lang: string) => {
    setLanguage((prev) =>
      prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang]
    )
  }

  const addUrl = () => {
    setUrls((prev) => [...prev, { url: '' }])
  }

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, field: 'label' | 'url', value: string) => {
    setUrls((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    )
  }

  const isValidUrl = (s: string): boolean => {
    const trimmed = s.trim()
    if (!trimmed) return false
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      const u = new URL(withProtocol)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
      const host = u.hostname.toLowerCase()
      return host === 'localhost' || host.includes('.')
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    const filledUrls = urls
      .map((u) => ({ label: u.label?.trim() || undefined, url: u.url.trim() }))
      .filter((u) => u.url)
    const invalidUrl = filledUrls.find((u) => !isValidUrl(u.url))
    if (invalidUrl) {
      setError(
        `"${invalidUrl.url}" is not a valid URL. Use a proper link like https://twitch.tv/you or https://youtube.com/@you`
      )
      return
    }
    setIsSaving(true)
    const validUrls = filledUrls.map((u) => ({
      label: u.label,
      url: /^https?:\/\//i.test(u.url) ? u.url : `https://${u.url}`,
    }))
    const res = await updateCreatorProfile({
      displayName,
      bio,
      categories,
      urls: validUrls,
      country,
      state,
      city,
      platform,
      game_category: gameTags,
      language,
      average_viewers: averageViewers === '' ? undefined : averageViewers,
      subs_followers: subsFollowers === '' ? undefined : subsFollowers,
      most_played_games: gameTags,
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
      setUrls([{ url: '' }])
      setCountry('')
      setState('')
      setCity('')
      setPlatform([])
      setGameTags([])
      setLanguage([])
      router.refresh()
    }
  }

  const labelClass = 'block text-sm font-medium cr-text-muted mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Profile saved successfully.</Alert>}

      <div>
        <label htmlFor="displayName" className={labelClass}>
          Display name
        </label>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="country" className={labelClass}>
            Country
          </label>
          <FormSelect
            id="country"
            variant="creator"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              setState('')
            }}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FormSelect>
        </div>
        {stateOptionsForCountry(country).length > 0 && (
          <div>
            <label htmlFor="state" className={labelClass}>
              State / Province / Region
            </label>
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
          <label htmlFor="city" className={labelClass}>
            City
          </label>
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Average Viewers</label>
          <FormInput
            type="number"
            variant="creator"
            value={averageViewers}
            onChange={(e) => setAverageViewers(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 5000"
            min={0}
          />
          {twitchSynced && (
            <p className="text-xs text-[#7b4fff] mt-1">
              ⚠ Auto-filled from Twitch — approximate, based on VOD views
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Followers / Subscribers</label>
          <FormInput
            type="number"
            variant="creator"
            value={subsFollowers}
            onChange={(e) => setSubsFollowers(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 50000"
            min={0}
          />
          {twitchSynced && (
            <p className="text-xs text-[#00c8ff] mt-1">
              ✓ Synced from Twitch
            </p>
          )}
        </div>
      </div>

      {/* Games / Genres */}
      <div>
        <label className={labelClass}>Games / Genres</label>
        <p className="text-xs cr-text-muted mb-2">
          Add tags (e.g. FPS, MOBA, RPG). Press Enter or click Add.
        </p>

        {/* Twitch suggestion banner */}
        {twitchGameSuggestions.length > 0 && hasUnusedGameSuggestions && (
          <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-[#7b4fff]/10 border border-[#7b4fff]/30">
            <svg className="w-4 h-4 text-[#7b4fff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#c8dff0]">
                From Twitch: {twitchGameSuggestions.join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={applyGameSuggestions}
              className="text-xs text-[#7b4fff] hover:text-[#9b6fff] font-medium shrink-0 transition-colors"
            >
              Apply
            </button>
          </div>
        )}

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
            className="px-4 py-2.5 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm font-medium hover:bg-[#00c8ff]/30 transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      </div>

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

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio
        </label>
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

        {/* Twitch suggestion banner */}
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

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass}>Links</label>
          <button
            type="button"
            onClick={addUrl}
            className="text-xs cr-accent hover:underline"
          >
            + Add link
          </button>
        </div>
        <p className="text-xs cr-text-muted mb-2">
          Add Twitch, YouTube, social profiles, or any URL tied to you.
        </p>
        <div className="space-y-4">
          {urls.map((u, i) => (
            <div key={i} className="p-3 rounded-lg cr-border border cr-bg-inner space-y-2">
              <div className="flex gap-2 items-center">
                <FormInput
                  type="text"
                  variant="creator"
                  value={u.label ?? ''}
                  onChange={(e) => updateUrl(i, 'label', e.target.value)}
                  placeholder="Label (e.g. Twitch)"
                  className="w-full sm:w-36"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  disabled={urls.length <= 1}
                  className="p-2.5 rounded-lg cr-text-muted hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit transition-colors shrink-0"
                  aria-label="Remove link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <FormInput
                type="text"
                inputMode="url"
                variant="creator"
                value={u.url}
                onChange={(e) => updateUrl(i, 'url', e.target.value)}
                placeholder="https://... or example.com"
              />
            </div>
          ))}
        </div>
      </div>

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
              <SecondaryButton
                className="flex-1 min-w-0"
                onClick={() => setShowDeleteConfirm(false)}
              >
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