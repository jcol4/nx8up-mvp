'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSponsorProfile, requestAgeRestrictionChange, type SponsorProfile } from './_actions'
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

  // Age restriction state (separate submission flow)
  const [ageRestricted, setAgeRestricted] = useState(profile?.age_restricted ?? false)
  const [ageRestrictionType, setAgeRestrictionType] = useState<string>(profile?.age_restriction_type ?? '')
  const [ageChangeMessage, setAgeChangeMessage] = useState('')
  const [isSubmittingAgeChange, setIsSubmittingAgeChange] = useState(false)
  const [ageChangeError, setAgeChangeError] = useState('')
  const [ageChangeSuccess, setAgeChangeSuccess] = useState(false)

  const ageRestrictionChanged =
    ageRestricted !== (profile?.age_restricted ?? false) ||
    (ageRestricted && ageRestrictionType !== (profile?.age_restriction_type ?? ''))

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
    if (ageRestrictionChanged) {
      setError('Submit or revert your age restriction change before saving the profile.')
      return
    }
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

  const handleAgeRestrictionChangeRequest = async () => {
    setAgeChangeError('')
    setAgeChangeSuccess(false)
    setIsSubmittingAgeChange(true)

    const res = await requestAgeRestrictionChange({
      requested_age_restricted: ageRestricted,
      requested_age_restriction_type: ageRestricted ? ageRestrictionType || null : null,
      sponsor_message: ageChangeMessage,
    })

    setIsSubmittingAgeChange(false)
    if (res.error) {
      setAgeChangeError(res.error)
    } else {
      setAgeChangeSuccess(true)
      setAgeChangeMessage('')
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
      <div className={sectionClass}>
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

      {/* ── Age Restrictions ─────────────────────────────────────────── */}
      <div className="space-y-4 pb-5 border-b dash-border">
        <div>
          <p className={sectionTitle}>Age Restrictions</p>
          <p className="text-xs dash-text-muted -mt-2 mb-3">
            If your products have legal age-marketing restrictions, enable this setting. Changes to age
            restrictions require admin approval.
          </p>

          {profile?.has_pending_age_restriction_request && (
            <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>A change request for age restrictions is pending admin review.</span>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={ageRestricted}
              onChange={e => {
                setAgeRestricted(e.target.checked)
                if (!e.target.checked) setAgeRestrictionType('')
              }}
              className="w-4 h-4 rounded border border-white/20 bg-white/5 accent-[#00c8ff]"
            />
            <span className="text-sm dash-text-muted">
              My company has products that legally cannot be marketed to certain age groups
            </span>
          </label>

          {ageRestricted && (
            <div className="mt-3 ml-7 space-y-2">
              <p className="text-xs dash-text-muted mb-2">Minimum legal marketing age:</p>
              <div className="flex gap-3">
                {['18+', '21+'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAgeRestrictionType(opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border ${
                      ageRestrictionType === opt
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'dash-border dash-text-muted hover:text-[#c8dff0] hover:border-orange-500/30 hover:bg-orange-500/5'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {ageRestrictionChanged && (
          <div className="ml-0 p-3 rounded-lg bg-[#00c8ff]/5 border border-[#00c8ff]/20 space-y-3">
            <p className="text-xs text-[#00c8ff] font-medium">
              Age restriction changes require admin approval before taking effect.
            </p>
            <div>
              <label className={labelClass}>
                Reason for change <span className="text-red-400">*</span>
              </label>
              <textarea
                value={ageChangeMessage}
                onChange={e => setAgeChangeMessage(e.target.value)}
                placeholder="Explain why you are changing your age restriction setting (e.g. product line update, regulatory compliance, etc.)"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg p-3 text-sm border dash-border dash-bg-inner dash-text focus:outline-none focus:border-[#00c8ff]/50 resize-none"
              />
              <p className="text-xs dash-text-muted text-right mt-0.5">{ageChangeMessage.length}/500</p>
            </div>
            {ageChangeError && <p className="text-xs text-red-400">{ageChangeError}</p>}
            {ageChangeSuccess && <p className="text-xs text-[#22c55e]">Change request submitted. Awaiting admin approval.</p>}
            <button
              type="button"
              onClick={handleAgeRestrictionChangeRequest}
              disabled={isSubmittingAgeChange}
              className="py-2 px-4 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] text-sm font-semibold hover:bg-[#00c8ff]/30 disabled:opacity-50 transition-colors"
            >
              {isSubmittingAgeChange ? 'Submitting...' : 'Submit Change Request'}
            </button>
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="pt-4 border-t dash-border space-y-3">
        {ageRestrictionChanged && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>
              You have unsaved age restriction changes. Submit a change request above or revert to your saved
              settings before saving the profile.
            </span>
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving || ageRestrictionChanged}
            className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
          {ageRestrictionChanged && (
            <button
              type="button"
              onClick={() => {
                setAgeRestricted(profile?.age_restricted ?? false)
                setAgeRestrictionType(profile?.age_restriction_type ?? '')
              }}
              className="py-2.5 px-5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              Revert age restriction
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
