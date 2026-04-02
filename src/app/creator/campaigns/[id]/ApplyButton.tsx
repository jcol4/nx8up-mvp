'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyToCampaign } from '../_actions'

const AUDIENCE_LOCATION_OPTIONS = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
  'France', 'Spain', 'Mexico', 'Brazil', 'Japan', 'South Korea', 'India',
  'Philippines', 'Indonesia', 'Netherlands', 'Sweden', 'Other',
] as const

const MEDIA_TYPE_LABELS: Record<string, string> = {
  youtube_video: 'YouTube Video',
  youtube_short: 'YouTube Short',
  twitch_stream: 'Twitch Stream',
  twitch_clip:   'Twitch Clip',
}

type Props = {
  campaignId: string
  profileLocation: string | null
  profileAudienceAgeMin: number | null
  profileAudienceAgeMax: number | null
  profileAudienceLocations: string[]
  acceptedMediaTypes: string[]
  eligible: boolean
  ineligibleReasons: string[]
}

export default function ApplyButton({
  campaignId,
  profileLocation,
  profileAudienceAgeMin,
  profileAudienceAgeMax,
  profileAudienceLocations,
  acceptedMediaTypes,
  eligible,
  ineligibleReasons,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [message, setMessage] = useState('')
  const [location, setLocation] = useState(profileLocation ?? '')
  const [ageMin, setAgeMin] = useState(profileAudienceAgeMin?.toString() ?? '')
  const [ageMax, setAgeMax] = useState(profileAudienceAgeMax?.toString() ?? '')
  const [audienceLocations, setAudienceLocations] = useState<string[]>(profileAudienceLocations)
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(
    acceptedMediaTypes.length === 1 ? [acceptedMediaTypes[0]] : []
  )

  const toggleMediaType = (val: string) =>
    setSelectedMediaTypes(prev =>
      prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]
    )

  const toggleAudienceLocation = (loc: string) =>
    setAudienceLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    )

  async function handleApply() {
    if (!message.trim()) {
      setError('Please tell the sponsor why you are a great fit.')
      return
    }
    setLoading(true)
    setError(null)
    if (acceptedMediaTypes.length > 0 && selectedMediaTypes.length === 0) {
      setError('Please select at least one media type you will deliver.')
      return
    }
    const res = await applyToCampaign(campaignId, {
      message,
      audienceAgeMin: ageMin ? parseInt(ageMin, 10) : null,
      audienceAgeMax: ageMax ? parseInt(ageMax, 10) : null,
      audienceLocations,
      location,
      mediaTypes: selectedMediaTypes,
    })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setOpen(false)
      router.refresh()
    }
  }

  if (!eligible) {
    return (
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold cr-text-bright">Apply to This Campaign</h2>
          <p className="text-xs cr-text-muted mt-0.5">Tell the sponsor why you're the right fit.</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="py-2.5 px-6 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed whitespace-nowrap">
            Requirements Not Met
          </div>
          {ineligibleReasons.length > 0 && (
            <div className="text-xs text-red-400/70 mt-1.5 space-y-0.5 text-left">
              {ineligibleReasons.map((r) => (
                <p key={r}>· {r}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-semibold cr-text-bright">Apply to This Campaign</h2>
          <p className="text-xs cr-text-muted mt-0.5">Tell the sponsor why you're the right fit.</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 py-2.5 px-6 rounded-lg font-semibold text-sm bg-[#00c8ff] text-[#0a1223] hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Apply to This Campaign
        </button>
      </div>
    )
  }

  const inputClass =
    'w-full rounded-lg p-3 text-sm cr-border border cr-bg-inner cr-text focus:outline-none focus:border-[#00c8ff]/50'
  const labelClass = 'block text-xs font-medium cr-text-muted mb-1.5 uppercase tracking-wide'

  return (
    <div className="space-y-4">
      {/* Pitch */}
      <div>
        <label className={labelClass}>Why are you a great fit? *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the sponsor about your audience, your content style, and why this campaign is a natural match for you..."
          rows={5}
          className={`${inputClass} resize-none`}
          maxLength={1000}
        />
        <p className="text-xs cr-text-muted mt-1 text-right">{message.length}/1000</p>
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>Your location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Austin, Texas, United States"
          className={inputClass}
        />
        {profileLocation && location !== profileLocation && (
          <button
            type="button"
            onClick={() => setLocation(profileLocation)}
            className="text-xs text-[#00c8ff] hover:underline mt-1"
          >
            Reset to profile location
          </button>
        )}
      </div>

      {/* Audience age range */}
      <div>
        <label className={labelClass}>Audience age range</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            placeholder="Min"
            min={13}
            max={65}
            className={`${inputClass} w-24`}
          />
          <span className="cr-text-muted text-sm shrink-0">to</span>
          <input
            type="number"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            placeholder="Max"
            min={13}
            max={65}
            className={`${inputClass} w-24`}
          />
        </div>
        {(profileAudienceAgeMin || profileAudienceAgeMax) &&
          (ageMin !== (profileAudienceAgeMin?.toString() ?? '') ||
            ageMax !== (profileAudienceAgeMax?.toString() ?? '')) && (
            <button
              type="button"
              onClick={() => {
                setAgeMin(profileAudienceAgeMin?.toString() ?? '')
                setAgeMax(profileAudienceAgeMax?.toString() ?? '')
              }}
              className="text-xs text-[#00c8ff] hover:underline mt-1"
            >
              Reset to profile values
            </button>
          )}
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
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                audienceLocations.includes(loc)
                  ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/40'
                  : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        {profileAudienceLocations.length > 0 &&
          JSON.stringify([...audienceLocations].sort()) !==
            JSON.stringify([...profileAudienceLocations].sort()) && (
            <button
              type="button"
              onClick={() => setAudienceLocations(profileAudienceLocations)}
              className="text-xs text-[#00c8ff] hover:underline mt-1.5"
            >
              Reset to profile selections
            </button>
          )}
      </div>

      {/* Media types */}
      {acceptedMediaTypes.length > 0 && (
        <div>
          <label className={labelClass}>Content type you will deliver *</label>
          <div className="flex flex-wrap gap-2">
            {acceptedMediaTypes.map((mt) => (
              <button
                key={mt}
                type="button"
                onClick={() => toggleMediaType(mt)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedMediaTypes.includes(mt)
                    ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/40'
                    : 'cr-border border cr-text-muted hover:text-[#c8dff0]'
                }`}
              >
                {MEDIA_TYPE_LABELS[mt] ?? mt}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 rounded-lg text-sm cr-text-muted border cr-border hover:text-[#c8dff0] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-[#00c8ff] text-[#0a1223] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}
