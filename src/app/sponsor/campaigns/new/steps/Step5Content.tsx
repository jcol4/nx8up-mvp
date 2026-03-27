'use client'

import FormInput from '@/components/ui/FormInput'
import FormTextarea from '@/components/ui/FormTextarea'
import type { CampaignDraft } from '../_shared'
import {
  labelClass, sectionClass, sectionTitle, toggleBtn,
  MISSION_TYPES, VIDEO_INCLUDES,
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
          ? 'border-[#00c8ff] bg-[rgba(0,200,255,0.06)]'
          : 'dash-border hover:border-[rgba(0,200,255,0.25)]'
      }`}
    >
      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
        active ? 'bg-[#00c8ff] border-[#00c8ff]' : 'border-[rgba(0,200,255,0.25)]'
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

  const hasYouTube = draft.platform.includes('YouTube')
  const hasTwitch = draft.platform.includes('Twitch')
  const hasSocialShort = draft.platform.includes('TikTok') || draft.platform.includes('Instagram')

  return (
    <div className="space-y-6">
      {/* Mission type */}
      <div className={sectionClass}>
        <p className={sectionTitle}>
          Campaign Type <span className="text-[#00c8ff]">*</span>
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

      {/* Deliverables */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Deliverables</p>

        {hasYouTube && (
          <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider">YouTube</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Number of videos</label>
                <FormInput
                  type="text" inputMode="numeric" variant="dashboard"
                  value={draft.num_videos}
                  onChange={e => set('num_videos', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 2"
                />
              </div>
            </div>
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
          </div>
        )}

        {hasTwitch && (
          <div className="space-y-3 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <p className="text-xs font-semibold text-[#a855f7] uppercase tracking-wider">Twitch</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Number of streams</label>
                <FormInput
                  type="text" inputMode="numeric" variant="dashboard"
                  value={draft.num_streams}
                  onChange={e => set('num_streams', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 4"
                />
              </div>
              <div>
                <label className={labelClass}>Min. stream duration (min)</label>
                <FormInput
                  type="text" inputMode="numeric" variant="dashboard"
                  value={draft.min_stream_duration}
                  onChange={e => set('min_stream_duration', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 60"
                />
              </div>
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
                <FormInput
                  type="text" inputMode="numeric" variant="dashboard"
                  value={draft.num_posts}
                  onChange={e => set('num_posts', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className={labelClass}>Number of short videos</label>
                <FormInput
                  type="text" inputMode="numeric" variant="dashboard"
                  value={draft.num_short_videos}
                  onChange={e => set('num_short_videos', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 2"
                />
              </div>
            </div>
          </div>
        )}

        {!hasYouTube && !hasTwitch && !hasSocialShort && (
          <p className="text-xs dash-text-muted italic">No platforms selected — go back to Step 1 to add platforms.</p>
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
        <button type="button" onClick={onNext} className="py-2.5 px-6 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
          Next →
        </button>
      </div>
    </div>
  )
}
