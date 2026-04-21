/**
 * Step 7 — Profile Summary (profile wizard).
 *
 * Read-only overview of all wizard data grouped into six panels:
 * Accounts, Metrics, Identity, Content & Audience, Brand Preferences,
 * and Eligibility. Each panel has an "Edit" link that calls `onEditStep`
 * to jump to that step while setting `returnToSummary = true`.
 *
 * The summary pulls data from three sources:
 *  - `draft`          — all user-entered fields from steps 3–6.
 *  - `twitchInitial`  — Twitch connection state (passed from profile page).
 *  - `youtubeInitial` — YouTube connection state (passed from profile page).
 *  - `creatorStats`   — live platform stats (from DB, passed from profile page).
 *
 * `fmt()` is a local helper that formats large numbers to K/M notation.
 * Note: a duplicate `fmt` function also exists in `CreatorStatsPanel.tsx`.
 *
 * "Go to Dashboard" calls `onFinish` which pushes `/creator`.
 */
'use client'

import {
  CREATOR_TYPE_OPTIONS,
  PREFERRED_CAMPAIGN_TYPE_OPTIONS,
  PREFERRED_PRODUCT_TYPE_OPTIONS,
  type CreatorProfileDraft,
} from '../_shared'

type TwitchData = {
  username: string | null
  broadcaster_type: string | null
  synced_at: Date | null
}

type YouTubeData = {
  handle: string | null
  channel_name: string | null
  subscribers: number | null
  avg_views: number | null
  synced_at: Date | null
}

type CreatorStats = {
  twitch_username: string | null
  subs_followers: number | null
  average_vod_views: number | null
  twitch_subscriber_count: number | null
  engagement_rate: { toNumber(): number } | null
  twitch_synced_at: Date | null
  youtube_channel_name: string | null
  youtube_handle: string | null
  youtube_subscribers: number | null
  youtube_avg_views: number | null
  youtube_watch_time_hours: number | null
  youtube_synced_at: Date | null
}

type Props = {
  draft: CreatorProfileDraft
  twitchInitial: TwitchData
  youtubeInitial: YouTubeData
  creatorStats: CreatorStats
  onEditStep: (step: number) => void
  onFinish: () => void
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs cr-text-muted shrink-0">{label}</span>
      <span className="text-xs cr-text-bright text-right">{value}</span>
    </div>
  )
}

function Pills({ label, values, color = 'cyan' }: { label: string; values: string[]; color?: 'cyan' | 'purple' }) {
  if (!values.length) return null
  const chip = color === 'purple'
    ? 'text-[10px] px-1.5 py-0.5 rounded bg-[rgba(123,79,255,0.12)] text-[#a78bfa] border border-[rgba(123,79,255,0.25)]'
    : 'text-[10px] px-1.5 py-0.5 rounded bg-[rgba(0,200,255,0.1)] text-[#00c8ff] border border-[rgba(0,200,255,0.2)]'
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-xs cr-text-muted shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {values.map(v => <span key={v} className={chip}>{v}</span>)}
      </div>
    </div>
  )
}

function SectionHeader({ title, step, onEdit }: { title: string; step: number; onEdit: (s: number) => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest cr-text-muted">{title}</p>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="text-xs text-[#00c8ff] hover:opacity-80 transition-opacity"
      >
        Edit
      </button>
    </div>
  )
}

function fmt(n: number | null | undefined): string | undefined {
  if (n == null) return undefined
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export default function Step7Summary({ draft, twitchInitial, youtubeInitial, creatorStats, onEditStep, onFinish }: Props) {
  const creatorTypeLabels = CREATOR_TYPE_OPTIONS
    .filter(o => draft.creator_types.includes(o.value))
    .map(o => o.label)

  const campaignTypeLabels = PREFERRED_CAMPAIGN_TYPE_OPTIONS
    .filter(o => draft.preferred_campaign_types.includes(o.value))
    .map(o => o.label)

  const productTypeLabels = PREFERRED_PRODUCT_TYPE_OPTIONS
    .filter(o => draft.preferred_product_types.includes(o.value))
    .map(o => o.label)

  const locationStr = [draft.city, draft.state, draft.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-5">
      <p className="text-xs cr-text-muted">
        Your profile is complete. You can edit any section below, or head to your dashboard.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Accounts */}
        <div>
          <SectionHeader title="Accounts" step={1} onEdit={onEditStep} />
          <div className="cr-panel p-3 space-y-3">
            {/* Twitch */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
              {twitchInitial.username ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs cr-text-bright truncate block">{twitchInitial.username}</span>
                  {twitchInitial.broadcaster_type && (
                    <span className="text-[10px] cr-text-muted capitalize">{twitchInitial.broadcaster_type || 'Standard'}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs cr-text-muted italic">Not connected</span>
              )}
              {twitchInitial.username && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(145,70,255,0.12)] text-[#9146ff] border border-[rgba(145,70,255,0.25)] shrink-0">Connected</span>
              )}
            </div>
            <div className="border-t border-white/5" />
            {/* YouTube */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              {youtubeInitial.channel_name || youtubeInitial.handle ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs cr-text-bright truncate block">{youtubeInitial.channel_name || youtubeInitial.handle}</span>
                  {youtubeInitial.handle && youtubeInitial.channel_name && (
                    <span className="text-[10px] cr-text-muted">{youtubeInitial.handle}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs cr-text-muted italic">Not connected</span>
              )}
              {(youtubeInitial.channel_name || youtubeInitial.handle) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(255,0,0,0.1)] text-[#ff6b6b] border border-[rgba(255,0,0,0.2)] shrink-0">Connected</span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <SectionHeader title="Metrics" step={2} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            {creatorStats.twitch_username && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-widest cr-text-muted mb-1.5">Twitch</p>
                <Row label="Followers" value={fmt(creatorStats.subs_followers)} />
                <Row label="Subscribers" value={fmt(creatorStats.twitch_subscriber_count)} />
                <Row label="Avg VOD views" value={fmt(creatorStats.average_vod_views)} />
                {creatorStats.engagement_rate != null && (
                  <Row label="CTR" value={`${Number(creatorStats.engagement_rate).toFixed(2)}%`} />
                )}
              </>
            )}
            {creatorStats.youtube_channel_name && (
              <>
                {creatorStats.twitch_username && <div className="border-t border-white/5 my-2" />}
                <p className="text-[10px] font-semibold uppercase tracking-widest cr-text-muted mb-1.5">YouTube</p>
                <Row label="Subscribers" value={fmt(creatorStats.youtube_subscribers)} />
                <Row label="Avg views" value={fmt(creatorStats.youtube_avg_views)} />
                {creatorStats.youtube_watch_time_hours != null && (
                  <Row label="Watch time (30d)" value={`${fmt(creatorStats.youtube_watch_time_hours)}h`} />
                )}
              </>
            )}
            {!creatorStats.twitch_username && !creatorStats.youtube_channel_name && (
              <p className="text-xs cr-text-muted italic py-2">No accounts connected yet.</p>
            )}
          </div>
        </div>

        {/* Identity */}
        <div>
          <SectionHeader title="Identity" step={3} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Row label="Display name" value={draft.displayName || '—'} />
            <Row label="Location" value={locationStr || undefined} />
            <Pills label="Languages" values={draft.language} />
            <Pills label="Creator type" values={creatorTypeLabels} />
            <Row label="Primary platform" value={draft.primary_platform || undefined} />
            {draft.bio && (
              <div className="py-2 border-b border-white/5 last:border-0">
                <span className="text-xs cr-text-muted block mb-1">Bio</span>
                <span className="text-xs cr-text-bright leading-relaxed line-clamp-3">{draft.bio}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content & Audience */}
        <div>
          <SectionHeader title="Content & Audience" step={4} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Pills label="Platforms" values={draft.platform} />
            <Pills label="Game genres" values={draft.game_category} />
            <Pills label="Content style" values={draft.content_style} />
            <Pills label="Categories" values={draft.content_type} />
            <Pills label="Audience interests" values={draft.audience_interests} color="purple" />
            <Pills label="Audience gender" values={draft.audience_gender} />
            {(draft.audience_age_min || draft.audience_age_max) && (
              <Row
                label="Audience age"
                value={[draft.audience_age_min, draft.audience_age_max].filter(Boolean).join(' – ')}
              />
            )}
            <Pills label="Audience locations" values={draft.audience_locations} />
          </div>
        </div>

        {/* Brand preferences */}
        <div>
          <SectionHeader title="Brand Preferences" step={5} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Pills label="Campaign types" values={campaignTypeLabels} />
            <Pills label="Product types" values={productTypeLabels} color="purple" />
            {!campaignTypeLabels.length && !productTypeLabels.length && (
              <p className="text-xs cr-text-muted italic py-2">No preferences set</p>
            )}
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <SectionHeader title="Eligibility" step={6} onEdit={onEditStep} />
          <div className="cr-panel p-3">
            <Row
              label="Availability"
              value={draft.is_available ? 'Available' : 'Not available'}
            />
            <Row
              label="Max campaigns / month"
              value={draft.max_campaigns_per_month || 'No limit'}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onFinish}
          className="py-2.5 px-7 rounded-lg bg-[#00c8ff] text-black text-sm font-bold hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,200,255,0.2)]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}
