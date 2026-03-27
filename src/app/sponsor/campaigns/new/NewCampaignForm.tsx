'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCampaign } from './_actions'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'
import Alert from '@/components/ui/Alert'
import FormInput from '@/components/ui/FormInput'
import FormTextarea from '@/components/ui/FormTextarea'

const labelClass = 'block text-sm font-medium dash-text-muted mb-1.5'
const sectionClass = 'space-y-4 pb-5 border-b dash-border'
const sectionTitle = 'text-xs font-semibold uppercase tracking-widest dash-text-muted mb-3'

const PLATFORMS = ['Twitch', 'YouTube', 'TikTok', 'Instagram', 'Other'] as const

const OBJECTIVES = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'traffic', label: 'Traffic' },
  { value: 'conversions', label: 'Conversions' },
] as const

const CAMPAIGN_TYPES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'milestone_based', label: 'Milestone-based' },
] as const

const PAYMENT_MODELS = [
  { value: 'fixed_per_creator', label: 'Fixed per creator' },
  { value: 'performance_based', label: 'Performance-based' },
  { value: 'hybrid', label: 'Hybrid' },
] as const

const AUDIENCE_LOCATION_OPTIONS = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Spain', 'Mexico', 'Brazil', 'Japan', 'South Korea', 'India',
  'Philippines', 'Indonesia', 'Netherlands', 'Sweden', 'Other',
] as const

export default function NewCampaignForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [brandName, setBrandName] = useState('')
  const [objective, setObjective] = useState('')
  const [campaignType, setCampaignType] = useState('')
  const [paymentModel, setPaymentModel] = useState('')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState<string[]>([])
  const [contentType, setContentType] = useState<string[]>([])
  const [gameTagInput, setGameTagInput] = useState('')
  const [gameCategory, setGameCategory] = useState<string[]>([])
  const [minFollowers, setMinFollowers] = useState('')
  const [minAvgViewers, setMinAvgViewers] = useState('')
  const [minAudienceAge, setMinAudienceAge] = useState('')
  const [maxAudienceAge, setMaxAudienceAge] = useState('')
  const [requiredLocations, setRequiredLocations] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const togglePlatform = (p: string) =>
    setPlatform((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))

  const toggleContentType = (cat: string) =>
    setContentType((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))

  const addGameTag = () => {
    const t = gameTagInput.trim()
    if (t && !gameCategory.includes(t)) {
      setGameCategory((prev) => [...prev, t])
      setGameTagInput('')
    }
  }

  const removeGameTag = (t: string) =>
    setGameCategory((prev) => prev.filter((x) => x !== t))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    const formData = new FormData()
    formData.set('title', title.trim())
    formData.set('brand_name', brandName.trim())
    formData.set('objective', objective)
    formData.set('campaign_type', campaignType)
    formData.set('payment_model', paymentModel)
    formData.set('budget', budget.trim())
    formData.set('start_date', startDate)
    formData.set('end_date', endDate)
    formData.set('description', description.trim())
    formData.set('platform', JSON.stringify(platform))
    formData.set('content_type', JSON.stringify(contentType))
    formData.set('game_category', JSON.stringify(gameCategory))
    formData.set('min_subs_followers', minFollowers.trim())
    formData.set('min_avg_viewers', minAvgViewers.trim())
    formData.set('min_audience_age', minAudienceAge.trim())
    formData.set('max_audience_age', maxAudienceAge.trim())
    formData.set('required_audience_locations', JSON.stringify(requiredLocations))

    const res = await createCampaign(formData)
    setIsSubmitting(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.push('/sponsor/campaigns')
  }

  const selectClass = 'w-full px-3 py-2 rounded-lg text-sm dash-border border dash-text-muted dash-bg-inner bg-transparent focus:outline-none focus:border-[#00c8ff]/50 transition-colors'

  return (
    <div className="dash-panel p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Campaign Identity */}
        <div className={sectionClass}>
          <p className={sectionTitle}>Campaign Identity</p>

          <div>
            <label htmlFor="campaign-title" className={labelClass}>
              Campaign name <span className="text-[#00c8ff]">*</span>
            </label>
            <FormInput
              id="campaign-title"
              type="text"
              variant="dashboard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Launch, Product Review"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label htmlFor="brand-name" className={labelClass}>
              Brand / Company name <span className="text-[#00c8ff]">*</span>
            </label>
            <FormInput
              id="brand-name"
              type="text"
              variant="dashboard"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Acme Corp"
              maxLength={100}
              required
            />
          </div>
        </div>

        {/* Campaign Configuration */}
        <div className={sectionClass}>
          <p className={sectionTitle}>Campaign Configuration</p>

          <div>
            <label htmlFor="objective" className={labelClass}>
              Campaign objective <span className="text-[#00c8ff]">*</span>
            </label>
            <select
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Select objective</option>
              {OBJECTIVES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="campaign-type" className={labelClass}>
                Campaign type <span className="text-[#00c8ff]">*</span>
              </label>
              <select
                id="campaign-type"
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Select type</option>
                {CAMPAIGN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="payment-model" className={labelClass}>
                Payment model <span className="text-[#00c8ff]">*</span>
              </label>
              <select
                id="payment-model"
                value={paymentModel}
                onChange={(e) => setPaymentModel(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">Select model</option>
                {PAYMENT_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budget & Timeline */}
        <div className={sectionClass}>
          <p className={sectionTitle}>Budget &amp; Timeline</p>

          <div>
            <label htmlFor="campaign-budget" className={labelClass}>
              Total budget (USD) <span className="text-[#00c8ff]">*</span>
            </label>
            <FormInput
              id="campaign-budget"
              type="number"
              inputMode="numeric"
              variant="dashboard"
              value={budget}
              onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className={labelClass}>
                Start date <span className="text-[#00c8ff]">*</span>
              </label>
              <FormInput
                id="start-date"
                type="date"
                variant="dashboard"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="end-date" className={labelClass}>
                End date <span className="text-[#00c8ff]">*</span>
              </label>
              <FormInput
                id="end-date"
                type="date"
                variant="dashboard"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className={sectionClass}>
          <p className={sectionTitle}>Additional details <span className="normal-case font-normal">(optional)</span></p>

          <div>
            <label htmlFor="campaign-desc" className={labelClass}>Description</label>
            <FormTextarea
              id="campaign-desc"
              variant="dashboard"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should creators do? Include deliverables, timeline..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div>
            <label className={labelClass}>Platform</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    platform.includes(p)
                      ? 'bg-[#00c8ff] text-black'
                      : 'dash-border border dash-text-muted hover:text-[#c8dff0]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Content type</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CONTENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleContentType(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    contentType.includes(cat)
                      ? 'bg-[#00c8ff] text-black'
                      : 'dash-border border dash-text-muted hover:text-[#c8dff0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Game / genre tags</label>
            <div className="flex gap-2 flex-wrap items-center">
              <FormInput
                type="text"
                variant="dashboard"
                value={gameTagInput}
                onChange={(e) => setGameTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGameTag())}
                placeholder="e.g. Valorant, FPS"
                className="flex-1 min-w-[120px]"
              />
              <button
                type="button"
                onClick={addGameTag}
                className="px-3 py-1.5 rounded-lg text-sm font-medium dash-border border dash-text-muted hover:text-[#c8dff0] transition-colors"
              >
                Add
              </button>
            </div>
            {gameCategory.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {gameCategory.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#00c8ff]/20 text-[#00c8ff] text-sm"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeGameTag(t)}
                      className="hover:opacity-80"
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="campaign-followers" className={labelClass}>Min. followers</label>
              <FormInput
                id="campaign-followers"
                type="text"
                inputMode="numeric"
                variant="dashboard"
                value={minFollowers}
                onChange={(e) => setMinFollowers(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label htmlFor="campaign-avg-viewers" className={labelClass}>Min. avg VOD views</label>
              <FormInput
                id="campaign-avg-viewers"
                type="text"
                inputMode="numeric"
                variant="dashboard"
                value={minAvgViewers}
                onChange={(e) => setMinAvgViewers(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
          </div>
        </div>

        {/* Audience Targeting */}
        <div className="space-y-4">
          <p className={sectionTitle}>Audience targeting <span className="normal-case font-normal">(optional)</span></p>

          <div>
            <label className={labelClass}>Target audience age range</label>
            <p className="text-xs dash-text-muted mb-2">
              Only creators whose audience age overlaps this range will be eligible.
            </p>
            <div className="flex items-center gap-3">
              <FormInput
                type="text"
                inputMode="numeric"
                variant="dashboard"
                value={minAudienceAge}
                onChange={(e) => setMinAudienceAge(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Min age"
                className="w-28"
              />
              <span className="dash-text-muted text-sm shrink-0">to</span>
              <FormInput
                type="text"
                inputMode="numeric"
                variant="dashboard"
                value={maxAudienceAge}
                onChange={(e) => setMaxAudienceAge(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Max age"
                className="w-28"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Required audience locations</label>
            <p className="text-xs dash-text-muted mb-2">
              Creators must have audiences in at least one of the selected regions.
            </p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_LOCATION_OPTIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() =>
                    setRequiredLocations((prev) =>
                      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    requiredLocations.includes(loc)
                      ? 'bg-[#00c8ff] text-black'
                      : 'dash-border border dash-text-muted hover:text-[#c8dff0]'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t dash-border">
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <Link
            href="/sponsor/campaigns"
            className="py-2.5 px-5 rounded-lg dash-border border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
