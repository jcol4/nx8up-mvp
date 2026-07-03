/**
 * Step 5 — Brand & Campaign Preferences (profile wizard).
 *
 * Lets the creator declare which sponsorship formats and product categories
 * best fit their content. Both sections use card-style multi-select buttons
 * with a label + description per option.
 *
 * Preferred campaign types (e.g. "Use & Show", "Explain & Demo") inform the
 * matching algorithm in `@/lib/matching`.
 * Preferred product types (e.g. "Gaming Hardware", "Consumable") similarly
 * feed into sponsor-to-creator matching.
 *
 * No save action is called here directly — `onNext` delegates to
 * `saveAndContinue` in the parent wizard.
 */
'use client'

import { useTranslations } from 'next-intl'
import {
  PREFERRED_CAMPAIGN_TYPE_OPTIONS,
  PREFERRED_PRODUCT_TYPE_OPTIONS,
  sectionTitle,
  type CreatorProfileDraft,
} from '../_shared'

type Props = {
  draft: CreatorProfileDraft
  setDraft: React.Dispatch<React.SetStateAction<CreatorProfileDraft>>
  onNext: () => void
  onBack: () => void
  returnToSummary?: boolean
}

const sectionCardClass =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-4 sm:p-5'

export default function Step5BrandPreferences({ draft, setDraft, onNext, onBack, returnToSummary }: Props) {
  const t = useTranslations('creator.profile')
  const tEnum = useTranslations('enums')
  const toggle = (field: 'preferred_campaign_types' | 'preferred_product_types', val: string) => {
    setDraft(d => {
      const arr = d[field]
      return {
        ...d,
        [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('s5Heading')}</p>
        <h2 className="mt-1 font-headline text-lg font-semibold text-[#e8f4ff]">{t('s5Title')}</h2>
        <p className="mt-1 text-sm cr-text-muted">
          {t('s5Desc')}
        </p>
      </div>

      {/* Preferred campaign types */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>{t('s5CampaignTypesTitle')}</p>
        <p className="mb-3 text-xs cr-text-muted">{t('s5CampaignTypesDesc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREFERRED_CAMPAIGN_TYPE_OPTIONS.map(opt => {
            const active = draft.preferred_campaign_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('preferred_campaign_types', opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  active
                    ? 'border-[#99f7ff]/45 bg-[#99f7ff]/10 shadow-[0_0_14px_rgba(153,247,255,0.18)]'
                    : 'border-white/10 bg-black/20 hover:border-[#99f7ff]/30 hover:bg-[#99f7ff]/[0.04]'
                }`}
              >
                <div className={`text-sm font-semibold mb-0.5 ${active ? 'text-[#99f7ff]' : 'text-[#e8f4ff]'}`}>
                  {tEnum(`creatorCampaignType.${opt.value}.label`)}
                </div>
                <div className="text-xs cr-text-muted">{tEnum(`creatorCampaignType.${opt.value}.desc`)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Preferred product types */}
      <div className={sectionCardClass}>
        <p className={sectionTitle}>{t('s5ProductTypesTitle')}</p>
        <p className="mb-3 text-xs cr-text-muted">{t('s5ProductTypesDesc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PREFERRED_PRODUCT_TYPE_OPTIONS.map(opt => {
            const active = draft.preferred_product_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('preferred_product_types', opt.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  active
                    ? 'border-[#c084fc]/45 bg-[#c084fc]/12 shadow-[0_0_14px_rgba(192,132,252,0.16)]'
                    : 'border-white/10 bg-black/20 hover:border-[#c084fc]/30 hover:bg-[#c084fc]/[0.05]'
                }`}
              >
                <div className={`text-sm font-semibold mb-0.5 ${active ? 'text-[#d8b4fe]' : 'text-[#e8f4ff]'}`}>
                  {tEnum(`creatorProductType.${opt.value}.label`)}
                </div>
                <div className="text-xs cr-text-muted">{tEnum(`creatorProductType.${opt.value}.desc`)}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium cr-text-muted transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]"
        >
          {t('s5Back')}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-[#99f7ff] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90"
        >
          {returnToSummary ? t('s5SaveChanges') : t('s5SaveContinue')}
        </button>
      </div>
    </div>
  )
}
