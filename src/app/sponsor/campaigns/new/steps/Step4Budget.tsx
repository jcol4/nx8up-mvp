'use client'

import FormInput from '@/components/ui/FormInput'
import NXDatePicker from '@/components/ui/NXDatePicker'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle } from '../_shared'

const BUDGET_STEP = 500

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

  const adjustBudget = (delta: number) => {
    const current = parseInt(draft.budget, 10) || 0
    set('budget', String(Math.max(0, current + delta)))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <style>{`
        .nx-budget-wrap {
          display: flex; align-items: stretch;
          background: rgba(0,200,255,0.03);
          border: 1px solid rgba(0,200,255,0.12);
          border-radius: 6px; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nx-budget-wrap:focus-within {
          border-color: rgba(0,200,255,0.35);
          box-shadow: 0 0 18px rgba(0,200,255,0.07);
        }
        .nx-budget-btn {
          width: 40px; display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-family: 'Rajdhani', sans-serif; font-weight: 600;
          color: #3a5570; background: rgba(0,200,255,0.04);
          border: none; cursor: pointer;
          transition: color 0.15s, background 0.15s; flex-shrink: 0;
          border-right: 1px solid rgba(0,200,255,0.08); user-select: none;
        }
        .nx-budget-btn:last-child { border-right: none; border-left: 1px solid rgba(0,200,255,0.08); }
        .nx-budget-btn:hover { color: #00c8ff; background: rgba(0,200,255,0.1); }
        .nx-budget-input {
          flex: 1; background: transparent; border: none; outline: none;
          text-align: center; font-family: 'Rajdhani', sans-serif;
          font-size: 1.05rem; font-weight: 600; letter-spacing: 0.04em;
          color: #c8dff0; padding: 0.6rem 0.5rem; min-width: 0;
          -moz-appearance: textfield;
        }
        .nx-budget-input::-webkit-outer-spin-button,
        .nx-budget-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .nx-budget-input::placeholder { color: #2a3f55; font-weight: 400; }
        .nx-budget-prefix {
          display: flex; align-items: center; padding: 0 0 0 0.75rem;
          font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 600;
          color: #3a5570; flex-shrink: 0;
        }
      `}</style>

      <div className="space-y-6">
        {/* Budget */}
        <div className={sectionClass}>
          <p className={sectionTitle}>Budget</p>

          <div>
            <label className={labelClass}>
              Total campaign budget (USD) <span className="text-[#00c8ff]">*</span>
            </label>
            <div className="nx-budget-wrap">
              <button type="button" className="nx-budget-btn" onClick={() => adjustBudget(-BUDGET_STEP)} aria-label="Decrease">−</button>
              <span className="nx-budget-prefix">$</span>
              <input
                className="nx-budget-input"
                type="number" inputMode="numeric" min="0" step={BUDGET_STEP}
                value={draft.budget}
                onChange={e => set('budget', e.target.value.replace(/[^\d]/g, ''))}
                placeholder="0"
              />
              <button type="button" className="nx-budget-btn" onClick={() => adjustBudget(BUDGET_STEP)} aria-label="Increase">+</button>
            </div>
            <p className="text-xs dash-text-muted mt-1.5">Use +/− to step by ${BUDGET_STEP.toLocaleString()}, or type any amount.</p>
          </div>
        </div>

        {/* Creator count */}
        <div className={sectionClass}>
          <p className={sectionTitle}>Creator Count</p>
          <div>
            <label className={labelClass}>
              Number of creators <span className="text-[#00c8ff]">*</span>
            </label>
            <FormInput
              type="text"
              inputMode="numeric"
              variant="dashboard"
              value={draft.creator_count}
              onChange={e => set('creator_count', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="e.g. 10"
              className="max-w-[200px]"
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
              <label className={labelClass}>
                Start date <span className="text-[#00c8ff]">*</span>
              </label>
              <NXDatePicker
                name="start_date_hidden"
                min={today}
                placeholder="Select start date"
                onChange={val => set('start_date', val)}
              />
            </div>
            <div>
              <label className={labelClass}>
                End date <span className="text-[#00c8ff]">*</span>
              </label>
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
    </>
  )
}
