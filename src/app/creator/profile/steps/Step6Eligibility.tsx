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

export default function Step6Eligibility({ draft, setDraft, error, isSaving, onSave, onBack }: Props) {
  return (
    <div className="space-y-6">
      {/* Availability toggle */}
      <div>
        <p className={sectionTitle}>Availability</p>
        <p className="text-xs cr-text-muted mb-4">
          Let sponsors know whether you are currently open to new sponsorship opportunities.
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, is_available: true }))}
            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${
              draft.is_available
                ? 'border-[#22c55e]/50 bg-[#22c55e]/10 text-[#22c55e]'
                : 'border-white/10 bg-white/[0.02] cr-text-muted hover:border-white/20'
            }`}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => setDraft(d => ({ ...d, is_available: false }))}
            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${
              !draft.is_available
                ? 'border-[#f87171]/50 bg-[#f87171]/10 text-[#f87171]'
                : 'border-white/10 bg-white/[0.02] cr-text-muted hover:border-white/20'
            }`}
          >
            Not Available
          </button>
        </div>
      </div>

      {/* Max campaigns */}
      <div>
        <p className={sectionTitle}>Max Campaigns Per Month</p>
        <p className="text-xs cr-text-muted mb-3">
          How many active sponsorships can you handle at once? Leave blank for no limit.
        </p>
        <FormInput
          type="number"
          variant="creator"
          value={draft.max_campaigns_per_month}
          onChange={e => setDraft(d => ({ ...d, max_campaigns_per_month: e.target.value }))}
          placeholder="e.g. 3"
          min={1}
          max={50}
          className="w-36"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-5 rounded-lg border border-white/10 cr-text-muted text-sm font-medium hover:text-[#c8dff0] hover:border-white/20 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
