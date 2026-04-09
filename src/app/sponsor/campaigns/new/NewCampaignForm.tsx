'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign, saveCampaignDraft } from './_actions'
import { EMPTY_DRAFT, STEP_LABELS, type CampaignDraft } from './_shared'
import Step1Basics from './steps/Step1Basics'
import Step2Audience from './steps/Step2Audience'
import Step3Creators, { type AvailableCreator } from './steps/Step3Creators'
import Step4Budget from './steps/Step4Budget'
import Step5Content from './steps/Step5Content'
import Step6Tracking from './steps/Step6Tracking'
import Step7Review from './steps/Step7Review'

const TOTAL_STEPS = 7

type Props = {
  initialDraft?: CampaignDraft
  editingId?: string
  sponsorAgeRestriction?: string | null
  availableCreators?: AvailableCreator[]
}

function validateStep(step: number, draft: CampaignDraft): string {
  switch (step) {
    case 1:
      if (!draft.title.trim()) return 'Campaign name is required.'
      if (!draft.product_type) return 'Product type is required.'
      if (!draft.objective) return 'Campaign goal is required.'
      if (!draft.platform.length) return 'Select at least one platform.'
      return ''
    case 3:
      if (draft.is_direct_invite && !draft.invited_creator_id) return 'Please select a creator to invite.'
      return ''
    case 4:
      if (!draft.budget || parseInt(draft.budget, 10) <= 0) return 'A budget greater than $0 is required.'
      if (!draft.is_direct_invite && (!draft.creator_count || parseInt(draft.creator_count, 10) <= 0)) return 'Number of creators is required.'
      if (!draft.start_date) return 'Start date is required.'
      if (!draft.end_date) return 'End date is required.'
      if (draft.start_date >= draft.end_date) return 'End date must be after start date.'
      return ''
    case 5:
      if (!draft.campaign_type) return 'Campaign type / mission is required.'
      return ''
    default:
      return ''
  }
}

export default function NewCampaignForm({ initialDraft, editingId, sponsorAgeRestriction, availableCreators = [] }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(editingId ? TOTAL_STEPS : 1)
  const [draft, setDraft] = useState<CampaignDraft>(initialDraft ?? EMPTY_DRAFT)
  const [stepError, setStepError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(editingId ?? null)
  // Free navigation: true when editing a saved draft or after reaching the review step
  const [freeNav, setFreeNav] = useState(!!editingId)

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const goNext = () => {
    const err = validateStep(step, draft)
    if (err) { setStepError(err); return }
    setStepError('')
    const next = Math.min(step + 1, TOTAL_STEPS)
    if (next === TOTAL_STEPS) setFreeNav(true)
    setStep(next)
    scrollTop()
  }

  const goBack = () => {
    setStepError('')
    setStep(s => Math.max(s - 1, 1))
    scrollTop()
  }

  const jumpToStep = (target: number) => {
    setStepError('')
    setStep(target)
    scrollTop()
  }

  const buildFormData = () => {
    const fd = new FormData()
    if (draftId) fd.set('draft_id', draftId)
    fd.set('title', draft.title)
    fd.set('brand_name', draft.brand_name)
    fd.set('product_name', draft.product_name)
    fd.set('product_type', draft.product_type)
    fd.set('objective', draft.objective)
    fd.set('platform', JSON.stringify(draft.platform))
    fd.set('audience_age_min', draft.audience_age_min)
    fd.set('audience_age_max', draft.audience_age_max)
    fd.set('target_genders', JSON.stringify(draft.target_genders))
    fd.set('required_audience_locations', JSON.stringify(draft.required_audience_locations))
    fd.set('target_cities', draft.target_cities)
    fd.set('target_interests', JSON.stringify(draft.target_interests))
    fd.set('is_direct_invite', String(draft.is_direct_invite))
    fd.set('invited_creator_id', draft.invited_creator_id)
    fd.set('creator_count', draft.is_direct_invite ? '1' : draft.creator_count)
    fd.set('creator_types', JSON.stringify(draft.creator_types))
    fd.set('creator_sizes', JSON.stringify(draft.creator_sizes))
    fd.set('min_subs_followers', draft.min_subs_followers)
    fd.set('min_engagement_rate', draft.min_engagement_rate)
    fd.set('budget', draft.budget)
    fd.set('payment_model', draft.payment_model)
    fd.set('preferred_payment_method', draft.preferred_payment_method)
    fd.set('start_date', draft.start_date)
    fd.set('end_date', draft.end_date)
    fd.set('accepted_media_types', JSON.stringify(draft.accepted_media_types))
    fd.set('campaign_type', draft.campaign_type)
    fd.set('num_videos', draft.num_videos)
    fd.set('video_includes', JSON.stringify(draft.video_includes))
    fd.set('num_youtube_shorts', draft.num_youtube_shorts)
    fd.set('num_streams', draft.num_streams)
    fd.set('num_twitch_clips', draft.num_twitch_clips)
    fd.set('min_stream_duration', draft.min_stream_duration)
    fd.set('num_posts', draft.num_posts)
    fd.set('num_short_videos', draft.num_short_videos)
    fd.set('content_guidelines', draft.content_guidelines)
    fd.set('must_include_link', String(draft.must_include_link))
    fd.set('must_include_promo_code', String(draft.must_include_promo_code))
    fd.set('must_tag_brand', String(draft.must_tag_brand))
    fd.set('landing_page_url', draft.landing_page_url)
    fd.set('tracking_type', draft.tracking_type)
    fd.set('conversion_goal', draft.conversion_goal)
    return fd
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setDraftSaved(false)
    const res = await saveCampaignDraft(buildFormData())
    setIsSavingDraft(false)
    if (res.error) { setStepError(res.error); return }
    if (res.id) setDraftId(res.id)
    setDraftSaved(true)
    setTimeout(() => router.push('/sponsor/campaigns'), 800)
  }

  const handleSubmit = async () => {
    setStepError('')
    setIsSubmitting(true)
    const res = await createCampaign(buildFormData())
    setIsSubmitting(false)
    if (res.error) { setStepError(res.error); return }
    // Redirect to payment — campaign is not live until funds are held in escrow
    router.push(`/sponsor/campaigns/${res.id}/pay`)
  }

  const stepProps = { draft, setDraft }

  return (
    <div className="space-y-6">
      {/* Step progress bar */}
      <div className="dash-panel p-4">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const isActive = n === step
            const isDone = n < step || (freeNav && n < TOTAL_STEPS)
            const isClickable = !isActive && (isDone || freeNav)

            const circle = (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#00c8ff] text-black shadow-[0_0_12px_rgba(0,200,255,0.5)]'
                  : isDone
                    ? 'bg-[rgba(0,200,255,0.2)] text-[#00c8ff] border border-[rgba(0,200,255,0.4)]'
                    : 'bg-white/5 text-[#2a3f55] border border-white/10'
              }`}>
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#00c8ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : n}
              </div>
            )

            return (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  {isClickable ? (
                    <button
                      type="button"
                      onClick={() => jumpToStep(n)}
                      className="rounded-full hover:opacity-80 transition-opacity focus:outline-none"
                      title={`Go to ${label}`}
                    >
                      {circle}
                    </button>
                  ) : circle}
                  <span className={`text-[10px] font-medium hidden sm:block ${
                    isActive ? 'text-[#00c8ff]' : isDone ? 'text-[#3a5570]' : 'text-[#2a3f55]'
                  }`}>
                    {label}
                  </span>
                </div>
                {n < TOTAL_STEPS && (
                  <div className={`flex-1 h-px mx-1.5 mb-4 transition-all ${
                    isDone ? 'bg-[rgba(0,200,255,0.35)]' : 'bg-white/5'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step title + save draft */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold dash-text-bright">
            Step {step} — {STEP_LABELS[step - 1]}
          </h2>
          <p className="text-xs dash-text-muted mt-0.5">{step} of {TOTAL_STEPS}</p>
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSavingDraft || isSubmitting}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border dash-border dash-text-muted text-xs font-medium hover:text-[#c8dff0] hover:border-[rgba(0,200,255,0.3)] transition-colors disabled:opacity-40"
        >
          {draftSaved ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[#22c55e]">Saved</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2h6.5L10 3.5V10H2V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M4 2v3h4V2M4 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </>
          )}
        </button>
      </div>

      {/* Step content */}
      {/* Steps 1 & 4 need overflow:visible so dropdowns/calendars can escape the panel */}
      <div className="dash-panel p-6" style={step === 1 || step === 4 ? { overflow: 'visible' } : undefined}>
        {step === 1 && <Step1Basics {...stepProps} error={stepError} onNext={goNext} />}
        {step === 2 && <Step2Audience {...stepProps} onNext={goNext} onBack={goBack} sponsorAgeRestriction={sponsorAgeRestriction} />}
        {step === 3 && <Step3Creators {...stepProps} onNext={goNext} onBack={goBack} availableCreators={availableCreators} />}
        {step === 4 && <Step4Budget {...stepProps} error={stepError} onNext={goNext} onBack={goBack} />}
        {step === 5 && <Step5Content {...stepProps} error={stepError} onNext={goNext} onBack={goBack} />}
        {step === 6 && <Step6Tracking {...stepProps} onNext={goNext} onBack={goBack} />}
        {step === 7 && (
          <Step7Review
            draft={draft}
            error={stepError}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  )
}
