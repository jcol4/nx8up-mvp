/**
 * AffiliateLinkCard — client component shown on the creator profile page.
 *
 * Two states, mirroring PayoutBanner's eligible/ineligible split:
 *  - Not fully set up → short teaser explaining what unlocks the link.
 *  - Fully set up → lazily fetches (and generates, if needed) the creator's
 *    `referral_code` via `getOrCreateReferralCode`, then renders a copyable
 *    `/r/c/:code` link built from `window.location.origin`.
 */
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getOrCreateReferralCode } from './_actions'

export default function AffiliateLinkCard({ eligible, bonus }: { eligible: boolean; bonus: number }) {
  const t = useTranslations('creator.profile')
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!eligible) return
    let cancelled = false
    getOrCreateReferralCode().then((code) => {
      if (!cancelled && code) setLink(`${window.location.origin}/r/c/${code}`)
    })
    return () => {
      cancelled = true
    }
  }, [eligible])

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="dash-panel dash-panel--nx-top mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#99f7ff]/25 border-t-2 border-t-[#bffcff] bg-[#99f7ff]/[0.08] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#99f7ff]">{t('affiliateHeading')}</p>
        <p className="mt-0.5 text-xs cr-text-muted">
          {eligible ? t('affiliateEligibleDesc', { bonus }) : t('affiliateLockedDesc')}
        </p>
        {eligible && link && (
          <p className="mt-1 truncate text-xs text-[#e8f4ff]/80">{link}</p>
        )}
      </div>
      {eligible && (
        <button
          onClick={handleCopy}
          disabled={!link}
          className="shrink-0 rounded-md bg-[#99f7ff] px-3 py-1.5 text-sm font-medium text-slate-900 transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {copied ? t('affiliateCopied') : t('affiliateCopy')}
        </button>
      )}
    </div>
  )
}
