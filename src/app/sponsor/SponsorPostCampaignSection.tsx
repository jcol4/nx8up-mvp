'use client'

import { useState } from 'react'
import { DashboardPanel } from '@/components/dashboard'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'
import Alert from '@/components/ui/Alert'
import FormInput from '@/components/ui/FormInput'
import FormTextarea from '@/components/ui/FormTextarea'

const labelClass = 'block text-sm font-medium dash-text-muted mb-1.5'

export default function SponsorPostCampaignSection() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [minFollowers, setMinFollowers] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccess(false)
    // TODO: Call server action when backend is ready
    await new Promise((r) => setTimeout(r, 500))
    setIsSubmitting(false)
    setSuccess(true)
    setTitle('')
    setDescription('')
    setBudget('')
    setCategories([])
    setMinFollowers('')
  }

  return (
    <DashboardPanel title="Post Campaign">
      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <Alert variant="success">
            Campaign posted! Creators matching your criteria will be notified.
          </Alert>
        )}

        <div>
          <label htmlFor="campaign-title" className={labelClass}>
            Campaign title
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
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="campaign-budget" className={labelClass}>
              Budget ($)
            </label>
            <FormInput
              id="campaign-budget"
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label htmlFor="campaign-followers" className={labelClass}>
              Min. followers (optional)
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
        </div>

        <div>
          <label className={labelClass}>Target categories</label>
          <p className="text-xs dash-text-muted mb-2">
            Select content categories to target the right creators.
          </p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CONTENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  categories.includes(cat)
                    ? 'bg-[#00c8ff] text-black'
                    : 'dash-border border dash-text-muted hover:text-[#c8dff0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSubmitting ? 'Posting...' : 'Post Campaign'}
        </button>
      </form>
    </DashboardPanel>
  )
}
