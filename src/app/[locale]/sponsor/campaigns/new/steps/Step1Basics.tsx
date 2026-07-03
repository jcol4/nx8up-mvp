'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('sponsor.campaignWizard')
  const tEnum = useTranslations('enums')
  const productTypeOptions = PRODUCT_TYPES.map(o => ({
    value: o.value,
    label: tEnum(`productType.${o.value}.label`),
    description: tEnum(`productType.${o.value}.desc`),
  }))
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
        <p className={sectionTitle}>{t('s1CampaignInfo')}</p>

        <div>
          <label className={labelClass}>
            {t('s1CampaignName')} <span className="text-[#99f7ff]">*</span>
          </label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.title}
            onChange={e => set('title', e.target.value)}
            placeholder={t('s1CampaignNamePlaceholder')}
            maxLength={80}
          />
        </div>

        <div>
          <label className={labelClass}>{t('s1BrandName')}</label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.brand_name}
            onChange={e => set('brand_name', e.target.value)}
            placeholder={t('s1BrandNamePlaceholder')}
            maxLength={100}
          />
        </div>
      </div>

      {/* What are you promoting */}
      <div className={sectionClass}>
        <p className={sectionTitle}>{t('s1Promoting')}</p>

        <div>
          <label className={labelClass}>{t('s1ProductName')}</label>
          <FormInput
            type="text"
            variant="dashboard"
            value={draft.product_name}
            onChange={e => set('product_name', e.target.value)}
            placeholder={t('s1ProductNamePlaceholder')}
            maxLength={100}
          />
        </div>

        <div>
          <label className={labelClass}>
            {t('s1ProductType')} <span className="text-[#99f7ff]">*</span>
          </label>
          <NXSelect
            options={productTypeOptions}
            value={draft.product_type}
            onChange={v => set('product_type', v)}
            placeholder={t('s1ProductTypePlaceholder')}
            required
          />
        </div>
      </div>

      {/* Campaign Goal */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-3">
          <p className={sectionTitle.replace('mb-3', 'mb-0')}>
            {t('s1CampaignGoal')} <span className="text-[#99f7ff]">*</span>
          </p>
          <div className="group relative">
            <span className="w-4 h-4 rounded-full border border-[rgba(153,247,255,0.35)] text-[#3a5570] text-nx-10 flex items-center justify-center cursor-default select-none">?</span>
            <div className="absolute left-6 top-0 w-52 bg-[rgba(8,16,32,0.98)] border border-[rgba(153,247,255,0.2)] rounded-lg p-3 text-xs dash-text-muted leading-relaxed z-20 hidden group-hover:block shadow-xl">
              {t('s1GoalTooltip')}
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
                  ? 'border-[#99f7ff] bg-[rgba(153,247,255,0.08)] shadow-[0_0_18px_rgba(153,247,255,0.14)]'
                  : 'dash-border hover:border-[rgba(153,247,255,0.35)] hover:bg-[rgba(153,247,255,0.05)]'
              }`}
            >
              <p className={`text-sm font-semibold ${draft.objective === obj.value ? 'text-[#99f7ff]' : 'dash-text-bright'}`}>
                {tEnum(`objective.${obj.value}.label`)}
              </p>
              <p className="text-xs dash-text-muted">{tEnum(`objective.${obj.value}.desc`)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-3">
        <p className={sectionTitle}>
          {t('s1Platforms')} <span className="text-[#99f7ff]">*</span>
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
          className="py-2.5 px-6 rounded-lg bg-[#99f7ff] text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
