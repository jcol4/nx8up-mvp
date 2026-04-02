'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitProof, getPostTimestamp } from '../_actions'

type Props = {
  applicationId: string
  existing: {
    proof_urls: string[]
    screenshot_url: string | null
    posted_at: Date | null
    disclosure_confirmed: boolean
    status: string
    sponsor_notes: string | null
    admin_notes: string | null
  } | null
}

function isoToLocal(iso: string): string {
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export default function ProofSubmitForm({ applicationId, existing }: Props) {
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>(
    existing?.proof_urls.length ? existing.proof_urls : ['']
  )
  const [fetchingIndex, setFetchingIndex] = useState<number | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState(existing?.screenshot_url ?? '')
  const [postedAt, setPostedAt] = useState(
    existing?.posted_at ? isoToLocal(existing.posted_at.toISOString()) : ''
  )
  const [timestampAutoFilled, setTimestampAutoFilled] = useState(false)
  const [disclosureConfirmed, setDisclosureConfirmed] = useState(
    existing?.disclosure_confirmed ?? false
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function updateUrl(index: number, value: string) {
    setUrls((prev) => {
      const next = prev.map((u, i) => (i === index ? value : u))
      const trimmed = next.map((u) => u.trim()).filter(Boolean)
      if (new Set(trimmed).size !== trimmed.length) {
        setError('Duplicate URLs are not allowed. Each video must be unique.')
      } else {
        setError(null)
      }
      return next
    })
  }

  function addUrl() {
    setUrls((prev) => [...prev, ''])
  }

  function removeUrl(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUrlBlur(index: number) {
    const url = urls[index]?.trim()
    if (!url) return
    setFetchingIndex(index)
    try {
      const result = await getPostTimestamp(url)
      if (result?.iso) {
        const formatted = isoToLocal(result.iso)
        setPostedAt(formatted)
        setTimestampAutoFilled(true)
      }
    } finally {
      setFetchingIndex(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setWarning(null)

    const trimmedUrls = urls.map((u) => u.trim()).filter(Boolean)
    if (new Set(trimmedUrls).size !== trimmedUrls.length) {
      setError('Duplicate URLs are not allowed. Each video must be unique.')
      return
    }

    setLoading(true)

    // Re-fetch timestamp from the first valid URL
    const firstUrl = urls.find((u) => u.trim())
    let finalPostedAt = postedAt
    if (firstUrl) {
      setFetchingIndex(0)
      try {
        const ts = await getPostTimestamp(firstUrl.trim())
        if (ts?.iso) {
          const formatted = isoToLocal(ts.iso)
          setPostedAt(formatted)
          setTimestampAutoFilled(true)
          finalPostedAt = formatted
        }
      } finally {
        setFetchingIndex(null)
      }
    }

    const result = await submitProof(applicationId, {
      proof_urls: urls,
      screenshot_url: screenshotUrl,
      posted_at: finalPostedAt,
      disclosure_confirmed: disclosureConfirmed,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      if (result.warning) setWarning(result.warning)
      setSuccess(true)
      router.refresh()
    }
  }

  const isApproved = existing?.status === 'approved'
  const isLocked = existing?.status === 'submitted' || existing?.status === 'admin_verified'
  const inputClass =
    'w-full rounded-lg px-3 py-2.5 text-sm cr-border border cr-bg-inner cr-text focus:outline-none focus:border-[#00c8ff]/50 placeholder:cr-text-muted'
  const labelClass = 'block text-xs font-medium cr-text-muted uppercase tracking-wide mb-1.5'

  if (isApproved) {
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
        <p className="text-sm font-semibold text-green-400">Submission approved by sponsor.</p>
      </div>
    )
  }

  if (isLocked) {
    return (
      <div className="flex items-center gap-3 py-3 rounded-lg px-3 bg-yellow-500/5 border border-yellow-500/20">
        <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-yellow-400">
            {existing?.status === 'submitted' ? 'Submission under admin review.' : 'Verified — awaiting sponsor approval.'}
          </p>
          <p className="text-xs cr-text-muted mt-0.5">You cannot edit your submission while it is being reviewed.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existing?.status === 'revision_requested' && (
        <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-500/20 space-y-2">
          <p className="text-sm text-orange-400 font-medium">The sponsor has requested a revision. Please update your submission below.</p>
          {existing.admin_notes && (
            <div className="pt-1 border-t border-orange-500/20">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-0.5">nx8up Admin</p>
              <p className="text-xs text-red-300">{existing.admin_notes}</p>
            </div>
          )}
          {existing.sponsor_notes && (
            <div className="pt-1 border-t border-orange-500/20">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-0.5">Sponsor</p>
              <p className="text-xs text-orange-300">{existing.sponsor_notes}</p>
            </div>
          )}
        </div>
      )}
      {existing?.status === 'admin_rejected' && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 space-y-2">
          <p className="text-sm text-red-400 font-medium">Your submission was not approved during admin review. Please update and resubmit.</p>
          {existing.admin_notes && (
            <div className="pt-1 border-t border-red-500/20">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-0.5">nx8up Admin</p>
              <p className="text-xs text-red-300">{existing.admin_notes}</p>
            </div>
          )}
          {existing.sponsor_notes && (
            <div className="pt-1 border-t border-red-500/20">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-0.5">Sponsor</p>
              <p className="text-xs text-orange-300">{existing.sponsor_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Post URLs */}
      <div>
        <label className={labelClass}>Post URLs * <span className="normal-case font-normal text-[#4a6080]">(add one per video / stream / clip)</span></label>
        <div className="space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="url"
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                onBlur={() => handleUrlBlur(i)}
                placeholder="https://twitch.tv/videos/... or https://youtube.com/watch?v=..."
                className={`${inputClass} ${fetchingIndex === i ? 'opacity-50' : ''}`}
                disabled={fetchingIndex === i}
              />
              {urls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  className="shrink-0 w-8 h-8 rounded-lg border cr-border flex items-center justify-center cr-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
                  title="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="mt-2 text-xs cr-accent hover:underline flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add another URL
        </button>
        <p className="text-xs cr-text-muted mt-1.5">
          YouTube and Twitch URLs are verified against your connected account.
        </p>
      </div>

      {/* Screenshot — optional */}
      <div>
        <label className={labelClass}>
          Screenshot URL <span className="normal-case text-[#4a6080] font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={screenshotUrl}
          onChange={(e) => setScreenshotUrl(e.target.value)}
          placeholder="https://i.imgur.com/... or any direct image link"
          className={inputClass}
        />
        <p className="text-xs cr-text-muted mt-1">
          A screenshot showing sponsor branding visible in your content.
        </p>
      </div>

      {/* Timestamp */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium cr-text-muted uppercase tracking-wide">
            Content posted at *
          </label>
          {fetchingIndex !== null && (
            <span className="text-xs cr-text-muted animate-pulse">Fetching from URL…</span>
          )}
          {fetchingIndex === null && timestampAutoFilled && postedAt && (
            <span className="text-xs text-green-400">Auto-filled from URL</span>
          )}
        </div>
        <input
          type="datetime-local"
          value={postedAt}
          onChange={(e) => { setPostedAt(e.target.value); setTimestampAutoFilled(false) }}
          className={`${inputClass} ${fetchingIndex !== null ? 'opacity-50' : ''}`}
          required
          disabled={fetchingIndex !== null}
        />
        <p className="text-xs cr-text-muted mt-1">
          Auto-filled from the first URL. Use the earliest post date if submitting multiple.
        </p>
      </div>

      {/* Disclosure */}
      <div className="rounded-lg p-4 border border-[#00c8ff]/20 bg-[#00c8ff]/5 space-y-2">
        <p className="text-xs font-semibold cr-text-bright uppercase tracking-wide">Disclosure confirmation</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={disclosureConfirmed}
            onChange={(e) => setDisclosureConfirmed(e.target.checked)}
            className="mt-0.5 accent-[#00c8ff]"
          />
          <span className="text-sm cr-text">
            I confirm that I included a clear and conspicuous sponsorship disclosure (e.g. #ad, #sponsored, or verbal disclosure at the start of content) as required by FTC guidelines and platform rules.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && !error && (
        <div className="rounded-lg p-3 bg-green-500/10 border border-green-500/20 text-sm text-green-400">
          Proof submitted successfully!
          {warning && <p className="mt-1 text-yellow-400 text-xs">{warning}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm bg-[#00c8ff] text-[#0a1223] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading
          ? 'Verifying & submitting…'
          : existing?.status === 'revision_requested' || existing?.status === 'admin_rejected'
            ? 'Resubmit Proof'
            : 'Submit Proof'}
      </button>
    </form>
  )
}
