/**
 * SponsorProfileForm — client-side form for editing the sponsor's profile.
 *
 * Sections:
 * 1. Company Info — name, location (country/state/city), target languages.
 * 2. Campaign Preferences — preferred platforms, content types, game/genre tags,
 *    typical budget range (capped at BUDGET_MAX = Stripe ACH limit).
 * 3. Payment Preferences — default payment method (card / ACH / either), with
 *    inline warnings for ACH latency.
 * 4. Creator Requirements — default minimums that pre-fill new campaign forms.
 * 5. Age Restrictions — requires a separate admin-approval workflow; changes are
 *    submitted as `sponsor_age_restriction_requests` records and cannot be saved
 *    together with the main profile form until the request is submitted or reverted.
 *
 * Key behaviors:
 * - Budget values are validated client-side AND server-side against BUDGET_MAX.
 * - Age restriction changes are intentionally gated: the main Save button is
 *   disabled while `ageRestrictionChanged` is true, forcing the sponsor to either
 *   submit a change request or revert before saving.
 * - `stateOptionsForCountry` dynamically renders a state/province dropdown for
 *   US, Canada, and UK only.
 *
 * External services: Clerk (via _actions), Prisma (via _actions), Stripe (budget limit).
 * Env vars: none directly — BUDGET_MAX is imported from @/lib/constants.
 */
'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateSponsorProfile, requestAgeRestrictionChange, type SponsorProfile } from './_actions'
import ProfilePictureUpload from '@/components/shared/ProfilePictureUpload'
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
import { BUDGET_MAX } from '@/lib/constants'
import FormSelect from '@/components/ui/FormSelect'

const PLATFORMS = ['Twitch', 'YouTube', 'TikTok', 'Instagram', 'Other'] as const

const labelClass = 'mb-1.5 block text-sm font-medium text-[#a9abb5]'
const sectionClass =
  'dash-panel dash-panel--nx-top space-y-4 rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 sm:p-5'
const sectionTitle = 'font-headline text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99f7ff]'

/**
 * Returns the list of state/province options for the given country.
 * Only US, Canada, and UK have sub-region options; all others return an empty
 * array, hiding the state dropdown entirely.
 */
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
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(profile?.preferred_payment_method ?? 'card')
  const [budgetMin, setBudgetMin] = useState(profile?.budget_min?.toString() ?? '')
  const [budgetMax, setBudgetMax] = useState(profile?.budget_max?.toString() ?? '')
  const [minAvgViewers, setMinAvgViewers] = useState(profile?.min_avg_viewers?.toString() ?? '')
  const [minSubsFollowers, setMinSubsFollowers] = useState(profile?.min_subs_followers?.toString() ?? '')
  const [minEngagementRate, setMinEngagementRate] = useState(profile?.min_engagement_rate?.toString() ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveComplete, setSaveComplete] = useState(false)

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
        ? 'border-[#99f7ff] bg-[#99f7ff] text-slate-900 shadow-[0_0_14px_rgba(153,247,255,0.3)]'
        : 'border-white/15 text-[#a9abb5] hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/8 hover:text-[#e8f4ff] hover:shadow-[0_0_14px_rgba(153,247,255,0.12)]'
    }`

  const budgetMinNum = budgetMin ? parseInt(budgetMin, 10) : 0
  const budgetMaxNum = budgetMax ? parseInt(budgetMax, 10) : 0
  const budgetMinOver = budgetMinNum > BUDGET_MAX
  const budgetMaxOver = budgetMaxNum > BUDGET_MAX

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (ageRestrictionChanged) {
      setError('Submit or revert your age restriction change before saving the profile.')
      return
    }
    if (budgetMinOver || budgetMaxOver) {
      setError(`Budget values cannot exceed $${BUDGET_MAX.toLocaleString()} — Stripe's ACH debit limit.`)
      return
    }
    setError('')
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
      preferred_payment_method: preferredPaymentMethod,
    })

    setIsSaving(false)
    if (res.error) {
      setError(res.error)
    } else {
      setSaveComplete(true)
      window.setTimeout(() => {
        router.replace('/sponsor')
      }, 1300)
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

  const saveSuccessOverlay =
    saveComplete &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[9999] flex justify-center bg-gradient-to-b from-black/45 via-black/20 to-black/35 pt-6 backdrop-blur-[2px] sm:pt-10"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="creator-hud save-success-toast mx-4 h-fit w-full max-w-lg rounded-xl border border-white/12 bg-[rgb(12_14_22/92%)] px-4 py-3.5 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-5 sm:py-4">
          <div className="flex gap-3.5 sm:gap-4">
            <div
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/[0.08]"
              aria-hidden
            >
              <svg className="h-5 w-5 text-[#99f7ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-headline text-[15px] font-semibold leading-snug text-[#e8f4ff] sm:text-base">
                Profile saved
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#a9abb5] sm:text-sm">
                Updates are live. Returning to your dashboard.
              </p>
              <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div className="save-success-toast__bar h-full w-full bg-[#99f7ff]/80" />
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <>
      {saveSuccessOverlay}
      <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* ── Profile Picture ──────────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Profile Picture</p>
        <p className="mb-3 text-xs text-[#a9abb5]">
          Your profile picture is shown to creators on campaign listings and deal room pages.
        </p>
        <ProfilePictureUpload />
      </div>

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
          <p className="mb-2 text-xs text-[#a9abb5]">Languages your campaigns are targeted to.</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_LANGUAGES.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleArr(language, setLanguage, lang)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                  language.includes(lang)
                    ? 'border-[#7b4fff]/50 bg-[#7b4fff]/30 text-[#c8dff0] shadow-[0_0_14px_rgba(123,79,255,0.25)]'
                    : 'border-white/15 text-[#a9abb5] hover:border-[rgba(123,79,255,0.35)] hover:bg-[rgba(123,79,255,0.05)] hover:text-[#c8dff0]'
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
          <p className="mb-2 text-xs text-[#a9abb5]">Platforms you typically run campaigns on.</p>
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
          <p className="mb-2 text-xs text-[#a9abb5]">Types of content you want creators to produce.</p>
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
          <p className="mb-2 text-xs text-[#a9abb5]">
            Games or genres you want your campaigns to appear in. Press Enter or click Add.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {gameTags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-lg bg-[#99f7ff]/20 px-2.5 py-1 text-sm text-[#99f7ff]"
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
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-[#a9abb5] transition-all duration-150 hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/8 hover:text-[#e8f4ff] hover:shadow-[0_0_14px_rgba(153,247,255,0.12)]"
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
            {budgetMinOver && (
              <div className="mt-1.5 flex items-start gap-1.5 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/8">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-amber-400">Maximum allowed is ${BUDGET_MAX.toLocaleString()} (Stripe ACH limit).</p>
              </div>
            )}
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
            {budgetMaxOver && (
              <div className="mt-1.5 flex items-start gap-1.5 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/8">
                <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-amber-400">Maximum allowed is ${BUDGET_MAX.toLocaleString()} (Stripe ACH limit).</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Preferences ──────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Payment Preferences</p>
        <p className="mb-3 text-xs text-[#a9abb5]">
          Your default payment method for campaign funding. You can override this per campaign.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { value: 'card', label: 'Credit / Debit Card', desc: 'Instant — charged immediately on launch' },
            { value: 'ach',  label: 'ACH Bank Transfer',   desc: 'Lower fees — US bank account via Stripe' },
            { value: 'both', label: 'Either',              desc: 'Choose at checkout' },
          ] as const).map(opt => {
            const active = preferredPaymentMethod === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPreferredPaymentMethod(opt.value)}
                className={`text-left p-3.5 rounded-lg border transition-all ${
                  active
                    ? 'border-[#99f7ff] bg-[#99f7ff]/10 shadow-[0_0_12px_rgba(153,247,255,0.15)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${active ? 'text-[#99f7ff]' : 'text-[#e8f4ff]'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs leading-snug text-[#a9abb5]">{opt.desc}</p>
              </button>
            )
          })}
        </div>
        {(preferredPaymentMethod === 'ach' || preferredPaymentMethod === 'both') && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-red-400 leading-relaxed">
              <span className="font-semibold">ACH is not instant.</span> Bank transfers typically take 3–5 business
              days to verify and clear — though they come with lower processing fees than card. Campaigns will not go live until payment settles.
            </p>
          </div>
        )}
      </div>

      {/* ── Creator Requirements ──────────────────────────────────────── */}
      <div className={sectionClass}>
        <p className={sectionTitle}>
          Default creator requirements{' '}
          <span className="normal-case font-normal">(optional)</span>
        </p>
        <p className="-mt-2 text-xs text-[#a9abb5]">
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
            <label htmlFor="min-engagement" className={labelClass}>Min. CTR (%)</label>
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
      <div className={sectionClass}>
        <div>
          <p className={sectionTitle}>Age Restrictions</p>
          <p className="mt-1 mb-5 text-xs text-[#a9abb5]">
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

          <label className="mt-4 flex w-fit cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={ageRestricted}
              onChange={e => {
                setAgeRestricted(e.target.checked)
                if (!e.target.checked) setAgeRestrictionType('')
              }}
              className="h-4 w-4 rounded border border-white/20 bg-white/5 accent-[#99f7ff]"
            />
            <span className="text-sm text-[#a9abb5]">
              My company has products that legally cannot be marketed to certain age groups
            </span>
          </label>

          {ageRestricted && (
            <div className="mt-3 ml-7 space-y-2">
              <p className="mb-2 text-xs text-[#a9abb5]">Minimum legal marketing age:</p>
              <div className="flex gap-3">
                {['18+', '21+'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAgeRestrictionType(opt)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border ${
                      ageRestrictionType === opt
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'border-white/15 text-[#a9abb5] hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-[#c8dff0]'
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
          <div className="ml-0 space-y-3 rounded-lg border border-[#99f7ff]/20 bg-[#99f7ff]/5 p-3">
            <p className="text-xs font-medium text-[#99f7ff]">
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
                className="w-full resize-none rounded-lg border border-white/15 bg-black/25 p-3 text-sm text-[#e8f4ff] focus:border-[#99f7ff]/50 focus:outline-none"
              />
              <p className="mt-0.5 text-right text-xs text-[#a9abb5]">{ageChangeMessage.length}/500</p>
            </div>
            {ageChangeError && <p className="text-xs text-red-400">{ageChangeError}</p>}
            {ageChangeSuccess && <p className="text-xs text-[#22c55e]">Change request submitted. Awaiting admin approval.</p>}
            <button
              type="button"
              onClick={handleAgeRestrictionChangeRequest}
              disabled={isSubmittingAgeChange}
              className="rounded-lg bg-[#99f7ff]/20 px-4 py-2 text-sm font-semibold text-[#99f7ff] transition-colors hover:bg-[#99f7ff]/30 disabled:opacity-50"
            >
              {isSubmittingAgeChange ? 'Submitting...' : 'Submit Change Request'}
            </button>
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
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
            className="rounded-lg bg-[#99f7ff] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save profile'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/sponsor')}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]"
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
    </>
  )
}
