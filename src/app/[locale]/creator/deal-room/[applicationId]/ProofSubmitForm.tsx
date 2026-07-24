/**
 * ProofSubmitForm — client component form for submitting proof of content
 * delivery in the deal room.
 *
 * Features:
 *  - Fixed, labeled required link slots — one per deliverable the campaign
 *    requested (e.g. "YouTube Video 1", "Twitch Stream 1"), derived from
 *    `deliverableSlots` computed server-side via `buildDeliverableSlots`.
 *  - Optional "additional link" rows beyond the requirement (add/remove).
 *  - Auto-fill timestamp: on blur of a URL input, calls `getPostTimestamp`
 *    (server action) to fetch the publish time from Twitch/YouTube, shown
 *    inline under that row (read-only, not user-editable).
 *  - Duplicate URL detection: validated client-side in real-time and
 *    server-side in `submitProof`.
 *  - Screenshot URLs: optional list of direct image links, in its own
 *    section at the bottom of the form.
 *  - Disclosure checkbox: FTC-required acknowledgement.
 *
 * Form states:
 *  - **Approved** → read-only success message.
 *  - **Locked** (submitted or admin_verified) → locked message, no editing.
 *  - **Revision requested / admin_rejected** → editable with contextual
 *    admin/sponsor notes shown at the top.
 *  - **Default** → standard submission form.
 *
 * The overall `posted_at` sent to `submitProof` is the earliest resolved
 * per-row timestamp, since the server still stores one representative date.
 */
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { submitProof, getPostTimestamp } from '../_actions'
import { detectProofPlatform } from '@/lib/platforms'
import type { DeliverableSlot, DeliverableType } from '@/lib/deliverable-slots'

const PLACEHOLDER_BY_TYPE: Record<DeliverableType, string> = {
  youtube_video: 'https://youtube.com/watch?v=...',
  youtube_short: 'https://youtube.com/shorts/...',
  twitch_stream: 'https://twitch.tv/videos/...',
  twitch_clip: 'https://clips.twitch.tv/...',
}

type Props = {
  applicationId: string
  deliverableSlots: DeliverableSlot[]
  existing: {
    proof_urls: string[]
    screenshot_urls: string[]
    posted_at: Date | null
    disclosure_confirmed: boolean
    status: string
    sponsor_notes: string | null
    admin_notes: string | null
  } | null
}

type LinkRow = {
  id: string
  label: string | null
  type: DeliverableType | null
  platform: string | null
  url: string
  postedAtIso: string | null
  fetching: boolean
}

let rowIdCounter = 0
function nextRowId(): string {
  rowIdCounter += 1
  return `row-${rowIdCounter}`
}

function seedRequiredRows(slots: DeliverableSlot[], existingUrls: string[]): LinkRow[] {
  return slots.map((slot, i) => ({
    id: nextRowId(),
    label: slot.label,
    type: slot.type,
    platform: slot.platform,
    url: existingUrls[i] ?? '',
    postedAtIso: null,
    fetching: false,
  }))
}

function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function ProofSubmitForm({ applicationId, deliverableSlots, existing }: Props) {
  const t = useTranslations('creator.dealRoom')
  const router = useRouter()

  const requiredCount = deliverableSlots.length
  const existingUrls = existing?.proof_urls ?? []

  const [requiredRows, setRequiredRows] = useState<LinkRow[]>(
    seedRequiredRows(deliverableSlots, existingUrls)
  )
  const [extraRows, setExtraRows] = useState<LinkRow[]>(
    existingUrls.length > requiredCount
      ? existingUrls.slice(requiredCount).map((url) => ({
          id: nextRowId(),
          label: null,
          type: null,
          platform: null,
          url,
          postedAtIso: null,
          fetching: false,
        }))
      : []
  )
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>(
    existing?.screenshot_urls.length ? existing.screenshot_urls : ['']
  )
  const [disclosureConfirmed, setDisclosureConfirmed] = useState(
    existing?.disclosure_confirmed ?? false
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function checkDuplicates(rows: LinkRow[]) {
    const trimmed = rows.map((r) => r.url.trim()).filter(Boolean)
    if (new Set(trimmed).size !== trimmed.length) {
      setError(t('proofDuplicate'))
    } else {
      setError(null)
    }
  }

  function updateRequiredUrl(id: string, value: string) {
    setRequiredRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, url: value } : r))
      checkDuplicates([...next, ...extraRows])
      return next
    })
  }

  function updateExtraUrl(id: string, value: string) {
    setExtraRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, url: value } : r))
      checkDuplicates([...requiredRows, ...next])
      return next
    })
  }

  function addExtraRow() {
    setExtraRows((prev) => [
      ...prev,
      { id: nextRowId(), label: null, type: null, platform: null, url: '', postedAtIso: null, fetching: false },
    ])
  }

  function removeExtraRow(id: string) {
    setExtraRows((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleUrlBlur(id: string, isExtra: boolean) {
    const setRows = isExtra ? setExtraRows : setRequiredRows
    const rows = isExtra ? extraRows : requiredRows
    const row = rows.find((r) => r.id === id)
    const url = row?.url.trim()
    if (!url) return

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, fetching: true } : r)))
    try {
      const result = await getPostTimestamp(url)
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, fetching: false, postedAtIso: result?.iso ?? r.postedAtIso } : r))
      )
    } catch {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, fetching: false } : r)))
    }
  }

  function updateScreenshotUrl(index: number, value: string) {
    setScreenshotUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  function addScreenshotUrl() {
    setScreenshotUrls((prev) => [...prev, ''])
  }

  function removeScreenshotUrl(index: number) {
    setScreenshotUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setWarning(null)

    const rows = [...requiredRows, ...extraRows]
    const trimmedUrls = rows.map((r) => r.url.trim()).filter(Boolean)
    if (new Set(trimmedUrls).size !== trimmedUrls.length) {
      setError(t('proofDuplicate'))
      return
    }
    const missingRequired = requiredRows.some((r) => !r.url.trim())
    if (missingRequired) {
      setError(t('proofMissingRequired'))
      return
    }

    setLoading(true)

    // Re-fetch timestamps for any row missing one, then use the earliest.
    const updatedRows = await Promise.all(
      rows.map(async (r) => {
        const url = r.url.trim()
        if (!url || r.postedAtIso) return r
        const ts = await getPostTimestamp(url)
        return ts?.iso ? { ...r, postedAtIso: ts.iso } : r
      })
    )
    setRequiredRows(updatedRows.slice(0, requiredRows.length))
    setExtraRows(updatedRows.slice(requiredRows.length))

    const resolvedTimestamps = updatedRows
      .filter((r) => r.url.trim() && r.postedAtIso)
      .map((r) => r.postedAtIso as string)

    if (resolvedTimestamps.length === 0) {
      setLoading(false)
      setError(t('proofNoTimestamp'))
      return
    }

    const earliestPostedAt = resolvedTimestamps.reduce((earliest, iso) =>
      new Date(iso) < new Date(earliest) ? iso : earliest
    )

    const result = await submitProof(applicationId, {
      proof_urls: updatedRows.map((r) => r.url),
      screenshot_urls: screenshotUrls,
      posted_at: earliestPostedAt,
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
        <p className="text-sm font-semibold text-green-400">{t('proofApproved')}</p>
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
            {existing?.status === 'submitted' ? t('proofLockedUnderReview') : t('proofLockedVerified')}
          </p>
          <p className="text-xs cr-text-muted mt-0.5">{t('proofLockedNote')}</p>
        </div>
      </div>
    )
  }

  function renderRow(row: LinkRow, isExtra: boolean) {
    const mismatch =
      row.platform && row.url.trim() && detectProofPlatform(row.url.trim()) != null &&
      detectProofPlatform(row.url.trim()) !== row.platform

    return (
      <div key={row.id} className="space-y-1">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            {row.label && (
              <p className="text-xs cr-text-muted mb-1">{row.label}</p>
            )}
            <input
              type="url"
              value={row.url}
              onChange={(e) =>
                isExtra ? updateExtraUrl(row.id, e.target.value) : updateRequiredUrl(row.id, e.target.value)
              }
              onBlur={() => handleUrlBlur(row.id, isExtra)}
              placeholder={row.type ? PLACEHOLDER_BY_TYPE[row.type] : t('proofUrlPlaceholder')}
              className={`${inputClass} ${row.fetching ? 'opacity-50' : ''}`}
              disabled={row.fetching}
            />
          </div>
          {isExtra && (
            <button
              type="button"
              onClick={() => removeExtraRow(row.id)}
              className="shrink-0 w-8 h-8 rounded-lg border cr-border flex items-center justify-center cr-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors self-end"
              title={t('proofRemove')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {row.fetching && (
          <p className="text-xs cr-text-muted animate-pulse">{t('proofFetching')}</p>
        )}
        {!row.fetching && row.postedAtIso && (
          <p className="text-xs text-green-400">{t('proofPostedAtInline', { date: formatPostedAt(row.postedAtIso) })}</p>
        )}
        {mismatch && row.platform && (
          <p className="text-xs text-orange-400">{t('proofPlatformMismatch', { platform: row.platform })}</p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existing?.status === 'revision_requested' && (
        <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-500/20 space-y-2">
          <p className="text-sm text-orange-400 font-medium">{t('proofRevisionMsg')}</p>
          {existing.admin_notes && (
            <div className="pt-1 border-t border-orange-500/20">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-0.5">{t('proofAdminLabel')}</p>
              <p className="text-xs text-red-300">{existing.admin_notes}</p>
            </div>
          )}
          {existing.sponsor_notes && (
            <div className="pt-1 border-t border-orange-500/20">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-0.5">{t('proofSponsorLabel')}</p>
              <p className="text-xs text-orange-300">{existing.sponsor_notes}</p>
            </div>
          )}
        </div>
      )}
      {existing?.status === 'admin_rejected' && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 space-y-2">
          <p className="text-sm text-red-400 font-medium">{t('proofRejectedMsg')}</p>
          {existing.admin_notes && (
            <div className="pt-1 border-t border-red-500/20">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-0.5">{t('proofAdminLabel')}</p>
              <p className="text-xs text-red-300">{existing.admin_notes}</p>
            </div>
          )}
          {existing.sponsor_notes && (
            <div className="pt-1 border-t border-red-500/20">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-0.5">{t('proofSponsorLabel')}</p>
              <p className="text-xs text-orange-300">{existing.sponsor_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Required deliverable links */}
      {requiredRows.length > 0 && (
        <div>
          <label className={labelClass}>{t('proofUrlsLabel')}</label>
          <div className="space-y-3">
            {requiredRows.map((row) => renderRow(row, false))}
          </div>
          <p className="text-xs cr-text-muted mt-1.5">{t('proofUrlVerifyNote')}</p>
        </div>
      )}

      {/* Additional (optional) links */}
      <div>
        <label className={labelClass}>
          {t('proofAdditionalLinksLabel')} <span className="normal-case font-normal cr-text-muted-subtle">{t('proofOptional')}</span>
        </label>
        <div className="space-y-3">
          {extraRows.map((row) => renderRow(row, true))}
        </div>
        <button
          type="button"
          onClick={addExtraRow}
          className="mt-2 text-xs cr-accent hover:underline flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('proofAddUrl')}
        </button>
      </div>

      {/* Disclosure */}
      <div className="rounded-lg p-4 border border-[#00c8ff]/20 bg-[#00c8ff]/5 space-y-2">
        <p className="text-xs font-semibold cr-text-bright uppercase tracking-wide">{t('proofDisclosureTitle')}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={disclosureConfirmed}
            onChange={(e) => setDisclosureConfirmed(e.target.checked)}
            className="mt-0.5 accent-[#00c8ff]"
          />
          <span className="text-sm cr-text">
            {t('proofDisclosureCheckbox')}
          </span>
        </label>
      </div>

      {/* Screenshots — optional, at the bottom */}
      <div>
        <label className={labelClass}>
          {t('proofScreenshotLabel')} <span className="normal-case cr-text-muted-subtle font-normal">{t('proofOptional')}</span>
        </label>
        <div className="space-y-2">
          {screenshotUrls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="url"
                value={url}
                onChange={(e) => updateScreenshotUrl(i, e.target.value)}
                placeholder={t('proofScreenshotPlaceholder')}
                className={inputClass}
              />
              {screenshotUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScreenshotUrl(i)}
                  className="shrink-0 w-8 h-8 rounded-lg border cr-border flex items-center justify-center cr-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
                  title={t('proofRemove')}
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
          onClick={addScreenshotUrl}
          className="mt-2 text-xs cr-accent hover:underline flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('proofAddScreenshot')}
        </button>
        <p className="text-xs cr-text-muted mt-1">
          {t('proofScreenshotHint')}
        </p>
      </div>

      {error && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && !error && (
        <div className="rounded-lg p-3 bg-green-500/10 border border-green-500/20 text-sm text-green-400">
          {t('proofSuccess')}
          {warning && <p className="mt-1 text-yellow-400 text-xs">{warning}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg font-semibold text-sm bg-[#00c8ff] text-[#0a1223] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading
          ? t('proofSubmitting')
          : existing?.status === 'revision_requested' || existing?.status === 'admin_rejected'
            ? t('proofResubmit')
            : t('proofSubmit')}
      </button>
    </form>
  )
}
