/**
 * Step 1 — Basics
 *
 * First step of the campaign creation wizard. Collects:
 * - Campaign name (required, max 80 chars)
 * - Brand name (optional)
 * - Product/service name (optional)
 * - Product type (required, selected via NXSelect)
 * - Campaign goal / objective (required, one of: awareness, engagement, traffic, conversions)
 * - Target platforms (required, multi-select toggle buttons)
 *
 * Validation errors are passed in from the parent `NewCampaignForm` and displayed
 * below the last form section.
 */
'use client'

import FormInput from '@/components/ui/FormInput'
import NXSelect from '@/components/ui/NXSelect'
import type { CampaignDraft } from '../_shared'
import { labelClass, sectionClass, sectionTitle, toggleBtn, PRODUCT_TYPES, OBJECTIVES, PLATFORMS } from '../_shared'

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  error: string
  onNext: () => void
}

export default function Step1Basics({ draft, setDraft, error, onNext }: Props) {
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }))

  const togglePlatform = (p: string) =>
    set('platform', draft.platform.includes(p)
      ? draft.platform.filter(x => x !== p)
      : [...draft.platform, p])

  return (
    <div className="space-y-6">
      {/* Campaign Info */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Campaign Info</p>

        <div>
          <label className={labelClass}>
            Campaign name <span className="text-[#00c8ff]">*</span>
          </label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Summer Launch, Product Review"
            maxLength={80}
          />
        </div>

        <div>
          <label className={labelClass}>Brand name</label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.brand_name}
            onChange={e => set('brand_name', e.target.value)}
            placeholder="e.g. Acme Corp"
            maxLength={100}
          />
        </div>
      </div>

      {/* What are you promoting */}
      <div className={sectionClass}>
        <p className={sectionTitle}>What are you promoting?</p>

        <div>
          <label className={labelClass}>Product / Service name</label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.product_name}
            onChange={e => set('product_name', e.target.value)}
            placeholder="e.g. GFuel Energy, Razer BlackShark V2"
            maxLength={100}
          />
        </div>

        <div>
          <label className={labelClass}>
            Product type <span className="text-[#00c8ff]">*</span>
          </label>
          <NXSelect
            options={PRODUCT_TYPES}
            value={draft.product_type}
            onChange={v => set('product_type', v)}
            placeholder="Select product type"
            required
          />
        </div>
      </div>

      {/* Campaign Goal */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-3">
          <p className={sectionTitle.replace('mb-3', 'mb-0')}>
            Campaign Goal <span className="text-[#00c8ff]">*</span>
          </p>
          <div className="group relative">
            <span className="w-4 h-4 rounded-full border border-[rgba(0,200,255,0.3)] text-[#3a5570] text-[10px] flex items-center justify-center cursor-default select-none">?</span>
            <div className="absolute left-6 top-0 w-52 bg-[rgba(8,16,32,0.98)] border border-[rgba(0,200,255,0.18)] rounded-lg p-3 text-xs dash-text-muted leading-relaxed z-20 hidden group-hover:block shadow-xl">
              This determines how your campaign is structured and the type of creators matched to it.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {OBJECTIVES.map(obj => (
            <button
              key={obj.value}
              type="button"
              onClick={() => set('objective', obj.value)}
              className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all duration-150 ${
                draft.objective === obj.value
                  ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)] shadow-[0_0_18px_rgba(0,200,255,0.12)]'
                  : 'dash-border hover:border-[rgba(0,200,255,0.3)] hover:bg-[rgba(0,200,255,0.03)]'
              }`}
            >
              <p className={`text-sm font-semibold ${draft.objective === obj.value ? 'text-[#00c8ff]' : 'dash-text-bright'}`}>
                {obj.label}
              </p>
              <p className="text-xs dash-text-muted">{obj.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-3">
        <p className={sectionTitle}>
          Platforms <span className="text-[#00c8ff]">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={toggleBtn(draft.platform.includes(p))}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-end pt-2 border-t dash-border">
        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
