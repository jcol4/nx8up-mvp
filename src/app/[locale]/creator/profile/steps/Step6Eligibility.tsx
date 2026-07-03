/**
 * Step 6 — Eligibility (profile wizard).
 *
 * The final data-entry step before the summary. Collects:
 *  - Availability toggle (Available / Not Available) — surfaces to sponsors
 *    on the campaign matching and admin creator views.
 *  - Max campaigns per month — optional cap; leave blank for no limit.
 *
 * The "Save & Continue" button here calls `onSave` (mapped to `saveProfile`
 * in the wizard), which always jumps to the summary step (step 7) rather than
 * advancing linearly. This differs from steps 3–5 which use `saveAndContinue`.
 *
 * `isSaving` is passed from the wizard to disable the button during the async
 * save and provide user feedback.
 */
'use client'

import { useTranslations } from 'next-intl'
import FormInput from '@/components/ui/FormInput'
import { sectionTitle, type CreatorProfileDraft } from '../_shared'

type Props = {
  draft: CreatorProfileDraft
  setDraft: React.Dispatch<React.SetStateAction<CreatorProfileDraft>>
  error?: string
  isSaving: boolean
  onSave: () => void
  onBack: () => void
}

const sectionCardClass =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-4 sm:p-5'

export default function Step6Eligibility({ draft, setDraft, error, isSaving, onSave, onBack }: Props) {
  const t = useTranslations('creator.profile')
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('s6Heading')}</p>
        <h2 className="mt-1 font-headline text-lg font-semibold text-[#e8f4ff]">{t('s6Title')}</h2>
        <p className="mt-1 text-sm cr-text-muted">
          {t('s6Desc')}
        </p>
      </div>

      {/* Availability toggle */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>{t('s6AvailabilityTitle')}</p>
        <p className="mb-4 text-xs cr-text-muted">
          {t('s6AvailabilityDesc')}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, is_available: true }))}
            className={`rounded-lg border py-3 px-4 text-sm font-semibold transition-all ${
              draft.is_available
                ? 'border-[#22c55e]/45 bg-[#22c55e]/12 text-[#4ade80] shadow-[0_0_12px_rgba(34,197,94,0.16)]'
                : 'border-white/10 bg-black/20 cr-text-muted hover:border-[#22c55e]/30 hover:bg-[#22c55e]/[0.04]'
            }`}
          >
            {t('s6Available')}
          </button>
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, is_available: false }))}
            className={`rounded-lg border py-3 px-4 text-sm font-semibold transition-all ${
              !draft.is_available
                ? 'border-[#f87171]/45 bg-[#f87171]/12 text-[#fca5a5] shadow-[0_0_12px_rgba(248,113,113,0.14)]'
                : 'border-white/10 bg-black/20 cr-text-muted hover:border-[#f87171]/30 hover:bg-[#f87171]/[0.04]'
            }`}
          >
            {t('s6NotAvailable')}
          </button>
        </div>
      </div>

      {/* Max campaigns */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>{t('s6MaxCampaignsTitle')}</p>
        <p className="mb-3 text-xs cr-text-muted">
          {t('s6MaxCampaignsDesc')}
        </p>
        <FormInput
          type="number"
          variant="creator"
          value={draft.max_campaigns_per_month}
          onChange={e => setDraft(d => ({ ...d, max_campaigns_per_month: e.target.value }))}
          placeholder={t('s6MaxCampaignsPlaceholder')}
          min={1}
          max={50}
          className="w-40"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium cr-text-muted transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]"
        >
          {t('s6Back')}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="rounded-lg bg-[#99f7ff] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? t('s6Saving') : t('s6SaveContinue')}
        </button>
      </div>
    </div>
  )
}
