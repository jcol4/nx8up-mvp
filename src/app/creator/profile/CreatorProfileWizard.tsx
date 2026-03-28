'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCreatorProfileWizard } from './_actions'
import { STEP_LABELS, type CreatorProfileDraft } from './_shared'
import Step1AccountConnections from './steps/Step1AccountConnections'
import Step2PlatformMetrics from './steps/Step2PlatformMetrics'
import Step3CreatorIdentity from './steps/Step3CreatorIdentity'
import Step4ContentTags from './steps/Step4ContentTags'
import Step5BrandPreferences from './steps/Step5BrandPreferences'
import Step6Eligibility from './steps/Step6Eligibility'
import Step7Summary from './steps/Step7Summary'

const TOTAL_STEPS = 7
const SUMMARY_STEP = 7

type TwitchData = {
  username: string | null
  broadcaster_type: string | null
  profile_image: string | null
  description: string | null
  synced_at: Date | null
}

type YouTubeData = {
  handle: string | null
  channel_name: string | null
  subscribers: number | null
  avg_views: number | null
  top_categories: string[]
  synced_at: Date | null
}

type CreatorStats = {
  twitch_username: string | null
  twitch_broadcaster_type: string | null
  twitch_created_at: Date | null
  twitch_synced_at: Date | null
  subs_followers: number | null
  average_vod_views: number | null
  twitch_subscriber_count: number | null
  engagement_rate: { toNumber(): number } | null
  youtube_channel_id: string | null
  youtube_channel_name: string | null
  youtube_handle: string | null
  youtube_subscribers: number | null
  youtube_avg_views: number | null
  youtube_watch_time_hours: number | null
  youtube_member_count: number | null
  youtube_top_categories: string[]
  youtube_synced_at: Date | null
}

type Props = {
  initialDraft: CreatorProfileDraft
  initialStep?: number
  twitchInitial: TwitchData
  youtubeInitial: YouTubeData
  creatorStats: CreatorStats
}

export default function CreatorProfileWizard({
  initialDraft,
  initialStep = 1,
  twitchInitial,
  youtubeInitial,
  creatorStats,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(initialStep)
  const [draft, setDraft] = useState<CreatorProfileDraft>(initialDraft)
  const [stepError, setStepError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  // When editing a section from the summary, return there after saving
  const [returnToSummary, setReturnToSummary] = useState(initialStep === SUMMARY_STEP)

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const goNext = () => {
    setStepError('')
    setStep(s => Math.min(s + 1, TOTAL_STEPS))
    scrollTop()
  }

  const goBack = () => {
    setStepError('')
    if (returnToSummary) {
      setStep(SUMMARY_STEP)
    } else {
      setStep(s => Math.max(s - 1, 1))
    }
    scrollTop()
  }

  const saveAndContinue = async () => {
    setStepError('')
    setIsSaving(true)
    const res = await updateCreatorProfileWizard(draft)
    setIsSaving(false)
    if (res.error) { setStepError(res.error); return }
    if (returnToSummary) {
      setStep(SUMMARY_STEP)
    } else {
      setStep(s => Math.min(s + 1, TOTAL_STEPS))
    }
    scrollTop()
  }

  const saveProfile = async () => {
    setStepError('')
    setIsSaving(true)
    const res = await updateCreatorProfileWizard(draft)
    setIsSaving(false)
    if (res.error) { setStepError(res.error); return }
    setStep(SUMMARY_STEP)
    setReturnToSummary(true)
    scrollTop()
  }

  const editStep = (targetStep: number) => {
    setStepError('')
    setReturnToSummary(true)
    setStep(targetStep)
    scrollTop()
  }

  // Jump directly to any already-completed step from the progress bar.
  // Preserves returnToSummary if it was already set (e.g. navigating from summary).
  const jumpToStep = (targetStep: number) => {
    setStepError('')
    setStep(targetStep)
    scrollTop()
  }

  const finish = () => router.push('/creator')

  const stepProps = { draft, setDraft }
  const isSummary = step === SUMMARY_STEP

  return (
    <div className="space-y-6">
      {/* Step progress bar */}
      <div className="cr-panel p-4">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const isActive = n === step
            const isDone = n < step || (returnToSummary && n < SUMMARY_STEP)
            const isClickable = !isActive && (isDone || returnToSummary)

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

      {/* Step title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold cr-text-bright">
            Step {step} — {STEP_LABELS[step - 1]}
          </h2>
          <p className="text-xs cr-text-muted mt-0.5">{step} of {TOTAL_STEPS}</p>
        </div>
      </div>

      {/* Step content */}
      <div className="cr-panel p-6">
        {step === 1 && (
          <Step1AccountConnections
            twitchInitial={twitchInitial}
            youtubeInitial={youtubeInitial}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <Step2PlatformMetrics
            creator={creatorStats}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <Step3CreatorIdentity
            {...stepProps}
            error={isSaving ? '' : stepError}
            onNext={saveAndContinue}
            onBack={goBack}
            returnToSummary={returnToSummary}
          />
        )}
        {step === 4 && (
          <Step4ContentTags
            {...stepProps}
            onNext={saveAndContinue}
            onBack={goBack}
            returnToSummary={returnToSummary}
          />
        )}
        {step === 5 && (
          <Step5BrandPreferences
            {...stepProps}
            onNext={saveAndContinue}
            onBack={goBack}
            returnToSummary={returnToSummary}
          />
        )}
        {step === 6 && (
          <Step6Eligibility
            {...stepProps}
            error={stepError}
            isSaving={isSaving}
            onSave={saveProfile}
            onBack={goBack}
          />
        )}
        {step === 7 && (
          <Step7Summary
            draft={draft}
            twitchInitial={twitchInitial}
            youtubeInitial={youtubeInitial}
            creatorStats={creatorStats}
            onEditStep={editStep}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  )
}
