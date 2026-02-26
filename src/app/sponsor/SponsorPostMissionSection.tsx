'use client'

import { useState } from 'react'
import { DashboardPanel } from '@/components/dashboard'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'

const inputClass =
  'w-full px-4 py-2.5 rounded-lg dash-border border dash-bg-inner dash-text placeholder-[#3a5570] focus:outline-none focus:ring-1 focus:ring-[#00c8ff]/50'
const labelClass = 'block text-sm font-medium dash-text-muted mb-1.5'

export default function SponsorPostMissionSection() {
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
    <DashboardPanel title="Post Mission">
      <form onSubmit={handleSubmit} className="space-y-4">
        {success && (
          <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 dash-success text-sm">
            Mission posted! Creators matching your criteria will be notified.
          </div>
        )}

        <div>
          <label htmlFor="mission-title" className={labelClass}>
            Mission title
          </label>
          <input
            id="mission-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Valorant Challenge, Product Review"
            className={inputClass}
            maxLength={80}
            required
          />
        </div>

        <div>
          <label htmlFor="mission-desc" className={labelClass}>
            Description
          </label>
          <textarea
            id="mission-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should creators do? Include deliverables, timeline..."
            className={`${inputClass} min-h-[80px] resize-y`}
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mission-budget" className={labelClass}>
              Budget ($)
            </label>
            <input
              id="mission-budget"
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 500"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mission-followers" className={labelClass}>
              Min. followers (optional)
            </label>
            <input
              id="mission-followers"
              type="text"
              inputMode="numeric"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              placeholder="e.g. 1000"
              className={inputClass}
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
          {isSubmitting ? 'Posting...' : 'Post Mission'}
        </button>
      </form>
    </DashboardPanel>
  )
}
