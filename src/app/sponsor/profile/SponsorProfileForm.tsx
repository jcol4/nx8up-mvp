'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSponsorProfile, type SponsorProfile } from './_actions'
import {
  COUNTRIES,
  US_STATES,
  CA_PROVINCES,
  UK_NATIONS,
  COMMON_LANGUAGES,
} from '@/lib/location-options'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'
import Alert from '@/components/ui/Alert'
import FormInput from '@/components/ui/FormInput'
import FormSelect from '@/components/ui/FormSelect'

const PLATFORMS = ['Twitch', 'YouTube', 'TikTok', 'Instagram', 'Other'] as const

const labelClass = 'block text-sm font-medium dash-text-muted mb-1.5'
const sectionClass = 'space-y-4 pb-5 border-b dash-border'
const sectionTitle = 'text-xs font-semibold uppercase tracking-widest dash-text-muted mb-3'

function stateOptionsForCountry(country: string): readonly string[] {
  if (country === 'United States') return US_STATES
  if (country === 'Canada') return CA_PROVINCES
  if (country === 'United Kingdom') return UK_NATIONS
  return []
}

type Props = {
  profile: SponsorProfile | null
}

export default function SponsorProfileForm({ profile }: Props) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [language, setLanguage] = useState<string[]>(profile?.language ?? [])
  const [platform, setPlatform] = useState<string[]>(profile?.platform ?? [])
  const [contentType, setContentType] = useState<string[]>(profile?.content_type ?? [])
  const [gameTagInput, setGameTagInput] = useState('')
  const [gameTags, setGameTags] = useState<string[]>(profile?.game_category ?? [])
  const [budgetMin, setBudgetMin] = useState(profile?.budget_min?.toString() ?? '')
  const [budgetMax, setBudgetMax] = useState(profile?.budget_max?.toString() ?? '')
  const [minAvgViewers, setMinAvgViewers] = useState(profile?.min_avg_viewers?.toString() ?? '')
  const [minSubsFollowers, setMinSubsFollowers] = useState(profile?.min_subs_followers?.toString() ?? '')
  const [minEngagementRate, setMinEngagementRate] = useState(profile?.min_engagement_rate?.toString() ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const toggleArr = <T extends string>(arr: T[], setArr: (v: T[]) => void, val: T) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const addGameTag = () => {
    const t = gameTagInput.trim()
    if (t && !gameTags.includes(t)) {
      setGameTags(prev => [...prev, t])
      setGameTagInput('')
    }
  }

  const toggleBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
      active
        ? 'bg-[#00c8ff] text-black border-[#00c8ff] shadow-[0_0_14px_rgba(0,200,255,0.35)]'
        : 'dash-border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.35)] hover:bg-[rgba(0,200,255,0.05)] hover:shadow-[0_0_14px_rgba(0,200,255,0.12)]'
    }`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSaving(true)

    const res = await updateSponsorProfile({
      company_name: companyName,
      country,
      state,
      city,
      language,
      platform,
      content_type: contentType,
      game_category: gameTags,
      budget_min: budgetMin ? parseInt(budgetMin, 10) : null,
      budget_max: budgetMax ? parseInt(budgetMax, 10) : null,
      min_avg_viewers: minAvgViewers ? parseInt(minAvgViewers, 10) : null,
      min_subs_followers: minSubsFollowers ? parseInt(minSubsFollowers, 10) : null,
      min_engagement_rate: minEngagementRate ? parseFloat(minEngagementRate) : null,
    })

    setIsSaving(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Profile saved successfully.</Alert>}

      {/* ── Company Info ─────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Company Info</p>

        <div>
          <label htmlFor="company-name" className={labelClass}>Company name</label>
          <FormInput
            id="company-name"
            type="text"
            variant="dashboard"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corp"
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="country" className={labelClass}>Country</label>
            <FormSelect
              id="country"
              variant="dashboard"
              value={country}
              onChange={e => { setCountry(e.target.value); setState('') }}
            >
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
          </div>
          {stateOptionsForCountry(country).length > 0 && (
            <div>
              <label htmlFor="state" className={labelClass}>State / Province</label>
              <FormSelect
                id="state"
                variant="dashboard"
                value={state}
                onChange={e => setState(e.target.value)}
              >
                <option value="">Select</option>
                {stateOptionsForCountry(country).map(s => <option key={s} value={s}>{s}</option>)}
              </FormSelect>
            </div>
          )}
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <FormInput
              id="city"
              type="text"
              variant="dashboard"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Languages</label>
          <p className="text-xs dash-text-muted mb-2">Languages your campaigns are targeted to.</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_LANGUAGES.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleArr(language, setLanguage, lang)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                  language.includes(lang)
                    ? 'bg-[#7b4fff]/30 text-[#c8dff0] border-[#7b4fff]/50 shadow-[0_0_14px_rgba(123,79,255,0.25)]'
                    : 'dash-border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(123,79,255,0.35)] hover:bg-[rgba(123,79,255,0.05)]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Campaign Preferences ─────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Campaign Preferences</p>

        <div>
          <label className={labelClass}>Preferred platforms</label>
          <p className="text-xs dash-text-muted mb-2">Platforms you typically run campaigns on.</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => toggleArr(platform, setPlatform, p)}
                className={toggleBtn(platform.includes(p))}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Content types</label>
          <p className="text-xs dash-text-muted mb-2">Types of content you want creators to produce.</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONTENT_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleArr(contentType, setContentType, cat)}
                className={toggleBtn(contentType.includes(cat))}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Game / genre focus</label>
          <p className="text-xs dash-text-muted mb-2">
            Games or genres you want your campaigns to appear in. Press Enter or click Add.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {gameTags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setGameTags(prev => prev.filter(x => x !== t))}
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
              value={gameTagInput}
              onChange={e => setGameTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGameTag())}
              placeholder="e.g. Valorant, FPS, RPG"
              className="flex-1"
            />
            <button
              type="button"
              onClick={addGameTag}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border dash-border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.35)] hover:bg-[rgba(0,200,255,0.05)] hover:shadow-[0_0_14px_rgba(0,200,255,0.12)]"
            >
              Add
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget-min" className={labelClass}>Typical budget min (USD)</label>
            <FormInput
              id="budget-min"
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={budgetMin}
              onChange={e => setBudgetMin(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label htmlFor="budget-max" className={labelClass}>Typical budget max (USD)</label>
            <FormInput
              id="budget-max"
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={budgetMax}
              onChange={e => setBudgetMax(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 10000"
            />
          </div>
        </div>
      </div>

      {/* ── Creator Requirements ──────────────────────────────────────── */}
      <div className="space-y-4">
        <p className={sectionTitle}>
          Default creator requirements{' '}
          <span className="normal-case font-normal">(optional)</span>
        </p>
        <p className="text-xs dash-text-muted -mt-2">
          These defaults pre-fill new campaigns. You can override them per campaign.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="min-avg-viewers" className={labelClass}>Min. avg viewers</label>
            <FormInput
              id="min-avg-viewers"
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={minAvgViewers}
              onChange={e => setMinAvgViewers(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label htmlFor="min-subs" className={labelClass}>Min. followers / subs</label>
            <FormInput
              id="min-subs"
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={minSubsFollowers}
              onChange={e => setMinSubsFollowers(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 1000"
            />
          </div>
          <div>
            <label htmlFor="min-engagement" className={labelClass}>Min. engagement rate (%)</label>
            <FormInput
              id="min-engagement"
              type="text"
              inputMode="decimal"
              variant="dashboard"
              value={minEngagementRate}
              onChange={e => setMinEngagementRate(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder="e.g. 3.5"
            />
          </div>
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-4 border-t dash-border">
        <button
          type="submit"
          disabled={isSaving}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? 'Saving...' : 'Save profile'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/sponsor')}
          className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
