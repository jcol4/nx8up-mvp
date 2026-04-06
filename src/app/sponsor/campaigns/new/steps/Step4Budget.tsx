'use client'

import NXStepper from '@/components/ui/NXStepper'
import NXDatePicker from '@/components/ui/NXDatePicker'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle } from '../_shared'

const BUDGET_STEP = 500
const COUNT_STEP  = 1

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  error: string
  onNext: () => void
  onBack: () => void
}

export default function Step4Budget({ draft, setDraft, error, onNext, onBack }: Props) {
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }))

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Budget */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Budget</p>
        <div>
          <label className={labelClass}>
            Total campaign budget (USD) <span className="text-[#00c8ff]">*</span>
          </label>
          <NXStepper
            value={draft.budget}
            onChange={v => set('budget', v)}
            step={BUDGET_STEP}
            min={0}
            prefix="$"
            placeholder="0"
          />
          <p className="text-xs dash-text-muted mt-1.5">
            Use +/− to step by ${BUDGET_STEP.toLocaleString()}, or type any amount.
          </p>
        </div>
      </div>

      {/* Creator count — hidden for direct invite (always 1) */}
      {!draft.is_direct_invite && (
        <div className={sectionClass}>
          <p className={sectionTitle}>Creator Count</p>
          <div>
            <label className={labelClass}>
              Number of creators <span className="text-[#00c8ff]">*</span>
            </label>
            <NXStepper
              value={draft.creator_count}
              onChange={v => set('creator_count', v)}
              step={COUNT_STEP}
              min={1}
              placeholder="0"
              className="max-w-[180px]"
            />
            {draft.budget && draft.creator_count && Number(draft.creator_count) > 0 && (
              <p className="text-xs dash-text-muted mt-1.5">
                ≈ <span className="text-[#c8dff0] font-medium">
                  ${Math.floor(parseInt(draft.budget, 10) / parseInt(draft.creator_count, 10)).toLocaleString()}
                </span> per creator
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment model */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Payment Model</p>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(0,200,255,0.18)] bg-[rgba(0,200,255,0.04)]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00c8ff] shadow-[0_0_8px_rgba(0,200,255,0.6)] shrink-0" />
          <div>
            <p className="text-sm font-semibold dash-text-bright">Fixed per Creator</p>
            <p className="text-xs dash-text-muted">Set rate per creator — more models coming soon</p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <p className={sectionTitle}>Campaign Duration</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start date <span className="text-[#00c8ff]">*</span></label>
            <NXDatePicker
              name="start_date_hidden"
              min={today}
              placeholder="Select start date"
              onChange={val => set('start_date', val)}
            />
          </div>
          <div>
            <label className={labelClass}>End date <span className="text-[#00c8ff]">*</span></label>
            <NXDatePicker
              name="end_date_hidden"
              min={draft.start_date || today}
              placeholder="Select end date"
              onChange={val => set('end_date', val)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          Next →
        </button>
      </div>
    </div>
  )
}
