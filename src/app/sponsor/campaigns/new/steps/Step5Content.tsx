'use client'

import NXStepper from '@/components/ui/NXStepper'
import FormTextarea from '@/components/ui/FormTextarea'
import type { CampaignDraft } from '../_shared'
import {
  labelClass, sectionClass, sectionTitle, toggleBtn,
  MISSION_TYPES, VIDEO_INCLUDES, MEDIA_TYPES,
} from '../_shared'

type Props = {
  draft: CampaignDraft
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>
  error: string
  onNext: () => void
  onBack: () => void
}

function Toggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
        active
          ? 'border-[#99f7ff] bg-[rgba(153,247,255,0.06)]'
          : 'dash-border hover:border-[rgba(153,247,255,0.25)]'
      }`}
    >
      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
        active ? 'bg-[#99f7ff] border-[#99f7ff]' : 'border-[rgba(153,247,255,0.25)]'
      }`}>
        {active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className={`text-sm font-medium ${active ? 'dash-text-bright' : 'dash-text-muted'}`}>{label}</span>
    </button>
  )
}

export default function Step5Content({ draft, setDraft, error, onNext, onBack }: Props) {
  const set = <K extends keyof CampaignDraft>(k: K, v: CampaignDraft[K]) =>
    setDraft(prev => ({ ...prev, [k]: v }))

  const toggleVideoIncludes = (val: string) =>
    set('video_includes', draft.video_includes.includes(val)
      ? draft.video_includes.filter(x => x !== val)
      : [...draft.video_includes, val])

  const toggleMediaType = (val: string) =>
    set('accepted_media_types', draft.accepted_media_types.includes(val)
      ? draft.accepted_media_types.filter(x => x !== val)
      : [...draft.accepted_media_types, val])

  const availableMediaTypes = MEDIA_TYPES.filter(m => draft.platform.includes(m.platform))

  const hasYouTubeVideo = draft.accepted_media_types.includes('youtube_video')
  const hasYouTubeShort = draft.accepted_media_types.includes('youtube_short')
  const hasTwitchStream = draft.accepted_media_types.includes('twitch_stream')
  const hasTwitchClip   = draft.accepted_media_types.includes('twitch_clip')
  const hasAnyYouTube   = hasYouTubeVideo || hasYouTubeShort
  const hasAnyTwitch    = hasTwitchStream || hasTwitchClip
  const hasSocialShort  = draft.platform.includes('TikTok') || draft.platform.includes('Instagram')

  return (
    <div className="space-y-6">
      {/* Mission type */}
      <div className={sectionClass}>
        <p className={sectionTitle}>
          Campaign Type <span className="text-[#99f7ff]">*</span>
        </p>
        <p className="text-xs dash-text-muted -mt-2">How you want creators to feature your product.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MISSION_TYPES.map(mt => (
            <button
              key={mt.value}
              type="button"
              onClick={() => set('campaign_type', mt.value)}
              className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all duration-150 ${
                draft.campaign_type === mt.value
                  ? 'border-[#7b4fff] bg-[rgba(123,79,255,0.06)] shadow-[0_0_18px_rgba(123,79,255,0.1)]'
                  : 'dash-border hover:border-[rgba(123,79,255,0.3)] hover:bg-[rgba(123,79,255,0.03)]'
              }`}
            >
              <p className={`text-sm font-semibold ${draft.campaign_type === mt.value ? 'text-[#a78bff]' : 'dash-text-bright'}`}>
                {mt.label}
              </p>
              <p className="text-xs dash-text-muted">{mt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Accepted media types */}
      {availableMediaTypes.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitle}>
            Accepted Media Types <span className="text-[#99f7ff]">*</span>
          </p>
          <p className="text-xs dash-text-muted -mt-2 mb-3">Select which content formats you will accept as proof of delivery.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableMediaTypes.map(m => {
              const active = draft.accepted_media_types.includes(m.value)
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMediaType(m.value)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-150 ${
                    active
                      ? 'border-[#99f7ff] bg-[rgba(153,247,255,0.06)]'
                      : 'dash-border hover:border-[rgba(153,247,255,0.25)]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    active ? 'bg-[#99f7ff] border-[#99f7ff]' : 'border-[rgba(153,247,255,0.25)]'
                  }`}>
                    {active && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${active ? 'dash-text-bright' : 'dash-text-muted'}`}>{m.label}</p>
                    <p className="text-xs dash-text-muted">{m.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Deliverables</p>

        {hasAnyYouTube && (
          <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider">YouTube</p>
            <div className="grid grid-cols-2 gap-3">
              {hasYouTubeVideo && (
                <div>
                  <label className={labelClass}>Number of videos</label>
                  <NXStepper
                    value={draft.num_videos}
                    onChange={v => set('num_videos', v)}
                    step={1} min={0} placeholder="0"
                  />
                </div>
              )}
              {hasYouTubeShort && (
                <div>
                  <label className={labelClass}>Number of Shorts</label>
                  <NXStepper
                    value={draft.num_youtube_shorts}
                    onChange={v => set('num_youtube_shorts', v)}
                    step={1} min={0} placeholder="0"
                  />
                </div>
              )}
            </div>
            {hasYouTubeVideo && (
              <div>
                <label className={labelClass}>Include in</label>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_INCLUDES.map(vi => (
                    <button
                      key={vi.value}
                      type="button"
                      onClick={() => toggleVideoIncludes(vi.value)}
                      className={toggleBtn(draft.video_includes.includes(vi.value))}
                    >
                      {vi.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {hasAnyTwitch && (
          <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs font-semibold text-[#a855f7] uppercase tracking-wider">Twitch</p>
            <div className="grid grid-cols-2 gap-3">
              {hasTwitchStream && (
                <div>
                  <label className={labelClass}>Number of streams</label>
                  <NXStepper
                    value={draft.num_streams}
                    onChange={v => set('num_streams', v)}
                    step={1} min={0} placeholder="0"
                  />
                </div>
              )}
              {hasTwitchClip && (
                <div>
                  <label className={labelClass}>Number of clips</label>
                  <NXStepper
                    value={draft.num_twitch_clips}
                    onChange={v => set('num_twitch_clips', v)}
                    step={1} min={0} placeholder="0"
                  />
                </div>
              )}
              {hasTwitchStream && (
                <div>
                  <label className={labelClass}>Min. stream duration (min)</label>
                  <NXStepper
                    value={draft.min_stream_duration}
                    onChange={v => set('min_stream_duration', v)}
                    step={30} min={0} suffix="min" placeholder="0"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {hasSocialShort && (
          <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wider">
              {[draft.platform.includes('TikTok') && 'TikTok', draft.platform.includes('Instagram') && 'Instagram'].filter(Boolean).join(' · ')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Number of posts</label>
                <NXStepper
                  value={draft.num_posts}
                  onChange={v => set('num_posts', v)}
                  step={1} min={0} placeholder="0"
                />
              </div>
              <div>
                <label className={labelClass}>Number of short videos</label>
                <NXStepper
                  value={draft.num_short_videos}
                  onChange={v => set('num_short_videos', v)}
                  step={1} min={0} placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {!hasAnyYouTube && !hasAnyTwitch && !hasSocialShort && (
          <p className="text-xs dash-text-muted italic">
            {draft.platform.length === 0
              ? 'No platforms selected — go back to Step 1 to add platforms.'
              : 'Select accepted media types above to configure deliverables.'}
          </p>
        )}
      </div>

      {/* Content guidelines */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Content Guidelines</p>
        <div>
          <label className={labelClass}>What should creators say or focus on?</label>
          <FormTextarea
            variant="dashboard"
            value={draft.content_guidelines}
            onChange={e => set('content_guidelines', e.target.value)}
            placeholder="Key messages, tone, things to highlight or avoid, call-to-action..."
            rows={4}
            maxLength={1000}
          />
        </div>
      </div>

      {/* Required elements */}
      <div className="space-y-3">
        <p className={sectionTitle}>Required Elements</p>
        <div className="space-y-2">
          <Toggle label="Must include link" active={draft.must_include_link} onChange={v => set('must_include_link', v)} />
          <Toggle label="Must include promo code" active={draft.must_include_promo_code} onChange={v => set('must_include_promo_code', v)} />
          <Toggle label="Must tag brand" active={draft.must_tag_brand} onChange={v => set('must_tag_brand', v)} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
      )}

      <div className="flex justify-between pt-2 border-t dash-border">
        <button type="button" onClick={onBack} className="py-2.5 px-5 rounded-lg border dash-border dash-text-muted text-sm font-medium hover:text-[#c8dff0] transition-colors">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#99f7ff] text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity">
          Next →
        </button>
      </div>
    </div>
  )
}
