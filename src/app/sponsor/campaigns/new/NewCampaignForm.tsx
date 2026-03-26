'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCampaign } from './_actions'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'
import Alert from '@/components/ui/Alert'
import FormInput from '@/components/ui/FormInput'
import FormTextarea from '@/components/ui/FormTextarea'
import NXDatePicker from '@/components/ui/NXDatePicker'

const labelClass = 'block text-sm font-medium dash-text-muted mb-1.5'

const PLATFORMS = ['Twitch', 'YouTube', 'TikTok', 'Instagram', 'Other'] as const

const AUDIENCE_LOCATION_OPTIONS = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Spain', 'Mexico', 'Brazil', 'Japan', 'South Korea', 'India',
  'Philippines', 'Indonesia', 'Netherlands', 'Sweden', 'Other',
] as const

export default function NewCampaignForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
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

  const togglePlatform = (p: string) => {
    setPlatform((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const toggleContentType = (cat: string) => {
    setContentType((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const addGameTag = () => {
    const t = gameTagInput.trim()
    if (t && !gameCategory.includes(t)) {
      setGameCategory((prev) => [...prev, t])
      setGameTagInput('')
    }
  }

  const removeGameTag = (t: string) => {
    setGameCategory((prev) => prev.filter((x) => x !== t))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    const formData = new FormData()
    formData.set('title', title.trim())
    formData.set('description', description.trim())
    formData.set('budget', budget.trim())
    formData.set('deadline', deadline.trim())
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

  return (
    <div className="dash-panel p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <div>
          <label htmlFor="campaign-title" className={labelClass}>
            Campaign title (required)
          </label>
          <FormInput
            id="campaign-title"
            type="text"
            variant="dashboard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Valorant Challenge, Product Review"
            maxLength={80}
            required
          />
        </div>

        <div>
          <label htmlFor="campaign-desc" className={labelClass}>
            Description
          </label>
          <FormTextarea
            id="campaign-desc"
            variant="dashboard"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should creators do? Include deliverables, timeline..."
            maxLength={500}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
          <label htmlFor="campaign-budget" className={labelClass}>
            Budget ($)
          </label>
          <FormInput
            id="campaign-budget"
            type="number"
            inputMode="numeric"
            variant="dashboard"
            value={budget}
            onChange={(e) => {
              // allow only digits; strip anything else
              const digitsOnly = e.target.value.replace(/[^\d]/g, '')
              setBudget(digitsOnly)
            }}
            placeholder="e.g. 500"
            required
          />
          </div>
          <div>
            <label className={labelClass}>Deadline</label>
            <NXDatePicker
              name="deadline"
              min={new Date().toISOString().split('T')[0]}
              placeholder="Select deadline"
              onChange={(val) => setDeadline(val)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Platform</label>
          <p className="text-xs dash-text-muted mb-2">
            Select platforms where creators will promote.
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  platform.includes(p)
                    ? 'bg-[#00c8ff] text-black'
                    : 'dash-border border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.05)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Content type</label>
          <p className="text-xs dash-text-muted mb-2">
            Select content categories to target the right creators.
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONTENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleContentType(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  contentType.includes(cat)
                    ? 'bg-[#00c8ff] text-black'
                    : 'dash-border border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.05)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Game / genre tags</label>
          <p className="text-xs dash-text-muted mb-2">
            Add tags to help creators find this campaign.
          </p>
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
              className="px-3 py-1.5 rounded-lg text-sm font-medium dash-border border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.05)] transition-colors"
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
            <label htmlFor="campaign-followers" className={labelClass}>
              Min. followers
            </label>
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
            <label htmlFor="campaign-avg-viewers" className={labelClass}>
              Min. avg VOD views
            </label>
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
                    : 'dash-border border dash-text-muted hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.05)]'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Posting...' : 'Post Campaign'}
          </button>
          <Link
            href="/sponsor/campaigns"
            className="py-2.5 px-5 rounded-lg dash-border border dash-text-muted text-sm font-medium hover:text-[#c8dff0]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
