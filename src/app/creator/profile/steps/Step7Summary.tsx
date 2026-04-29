/**
 * Step 7 — Profile Summary (profile wizard).
 *
 * Read-only overview of all wizard data grouped into six panels:
 * Accounts, Metrics, Identity, Content & Audience, Brand Preferences,
 * and Eligibility. Each panel has an "Edit" link that calls `onEditStep`
 * to jump to that step while setting `returnToSummary = true`.
 *
 * The summary pulls data from these sources:
 *  - `draft`          — all user-entered fields from steps 3–6.
 *  - `twitchInitial`  — Twitch connection state (passed from profile page).
 *  - `youtubeInitial` — YouTube connection state (passed from profile page).
 *  - `steamInitial`   — Steam connection state (passed from profile page).
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

type SteamData = {
  steam_id: string | null
  username: string | null
  profile_url: string | null
  avatar_url: string | null
  visibility: number | null
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
  steamInitial: SteamData
  creatorStats: CreatorStats
  onEditStep: (step: number) => void
  onFinish: () => void
}

const summaryCardClass =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-3 sm:p-4'

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-white/18 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-[#8f97ab]">{label}</span>
      <span className="text-right text-xs text-[#e8f4ff]">{value}</span>
    </div>
  )
}

function Pills({ label, values, color = 'cyan' }: { label: string; values: string[]; color?: 'cyan' | 'purple' }) {
  if (!values.length) return null
  const chip = color === 'purple'
    ? 'rounded border border-[#c084fc]/35 bg-[#c084fc]/15 px-1.5 py-0.5 text-[10px] text-[#d8b4fe]'
    : 'rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-1.5 py-0.5 text-[10px] text-[#99f7ff]'
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-white/18 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-[#8f97ab]">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {values.map(v => <span key={v} className={chip}>{v}</span>)}
      </div>
    </div>
  )
}

function SectionHeader({ title, step, onEdit }: { title: string; step: number; onEdit: (s: number) => void }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="font-headline text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99f7ff]">{title}</p>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="text-xs font-medium text-[#99f7ff] transition-opacity hover:opacity-80"
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

export default function Step7Summary({ draft, twitchInitial, youtubeInitial, steamInitial, creatorStats, onEditStep, onFinish }: Props) {
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
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs text-[#a9abb5]">
        Your profile is complete. You can edit any section below, or head to your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Accounts */}
        <div className={summaryCardClass}>
          <SectionHeader title="Accounts" step={1} onEdit={onEditStep} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3 space-y-3">
            {/* Twitch */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
              {twitchInitial.username ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#e8f4ff] truncate block">{twitchInitial.username}</span>
                  {twitchInitial.broadcaster_type && (
                    <span className="text-[10px] text-[#8f97ab] capitalize">{twitchInitial.broadcaster_type || 'Standard'}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[#8f97ab] italic">Not connected</span>
              )}
              {twitchInitial.username && (
                <span className="shrink-0 rounded border border-[#a970ff]/35 bg-[#a970ff]/12 px-1.5 py-0.5 text-[10px] text-[#d8b4fe]">Connected</span>
              )}
            </div>
            <div className="border-t border-white/18" />
            {/* YouTube */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              {youtubeInitial.channel_name || youtubeInitial.handle ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#e8f4ff] truncate block">{youtubeInitial.channel_name || youtubeInitial.handle}</span>
                  {youtubeInitial.handle && youtubeInitial.channel_name && (
                    <span className="text-[10px] text-[#8f97ab]">{youtubeInitial.handle}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[#8f97ab] italic">Not connected</span>
              )}
              {(youtubeInitial.channel_name || youtubeInitial.handle) && (
                <span className="shrink-0 rounded border border-red-500/35 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300">Connected</span>
              )}
            </div>
            <div className="border-t border-white/18" />
            {/* Steam */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="#66c0f4"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.083 3.166 9.426 7.626 11.166l-.082-.041 3.547-1.452a3.375 3.375 0 1 0 4.064-4.86l3.6-2.594.139.001a4.5 4.5 0 1 0-4.5-4.5v.054l-2.586 3.745a3.376 3.376 0 0 0-2.748.92L0 12c.001 6.627 5.373 12 12 12s12-5.373 12-12S18.627 0 12 0zm-2.18 17.85l-1.13.464a2.531 2.531 0 1 0 1.466-3.34l1.166-.484c1.288.504 1.913 1.967 1.387 3.275-.523 1.288-1.967 1.913-3.275 1.387l.386-.302zm9.105-7.34a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
              {steamInitial.steam_id ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#e8f4ff] truncate block">{steamInitial.username ?? 'Steam User'}</span>
                  <span className="text-[10px] text-[#8f97ab] font-mono">{steamInitial.steam_id}</span>
                </div>
              ) : (
                <span className="text-xs text-[#8f97ab] italic">Not connected</span>
              )}
              {steamInitial.steam_id && (
                <span className="shrink-0 rounded border border-[#66c0f4]/35 bg-[#66c0f4]/10 px-1.5 py-0.5 text-[10px] text-[#bcdcf2]">Connected</span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className={summaryCardClass}>
          <SectionHeader title="Metrics" step={2} onEdit={onEditStep} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            {creatorStats.twitch_username && (
              <>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#8f97ab]">Twitch</p>
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
                {creatorStats.twitch_username && <div className="my-2 border-t border-white/18" />}
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#8f97ab]">YouTube</p>
                <Row label="Subscribers" value={fmt(creatorStats.youtube_subscribers)} />
                <Row label="Avg views" value={fmt(creatorStats.youtube_avg_views)} />
                {creatorStats.youtube_watch_time_hours != null && (
                  <Row label="Watch time (30d)" value={`${fmt(creatorStats.youtube_watch_time_hours)}h`} />
                )}
              </>
            )}
            {!creatorStats.twitch_username && !creatorStats.youtube_channel_name && (
              <p className="py-2 text-xs text-[#8f97ab] italic">No accounts connected yet.</p>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className={summaryCardClass}>
          <SectionHeader title="Identity" step={3} onEdit={onEditStep} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            <Row label="Display name" value={draft.displayName || '—'} />
            <Row label="Location" value={locationStr || undefined} />
            <Pills label="Languages" values={draft.language} />
            <Pills label="Creator type" values={creatorTypeLabels} />
            <Row label="Primary platform" value={draft.primary_platform || undefined} />
            {draft.bio && (
              <div className="border-b border-white/10 py-2.5 last:border-0">
                <span className="mb-1 block text-xs text-[#8f97ab]">Bio</span>
                <span className="line-clamp-3 text-xs leading-relaxed text-[#e8f4ff]">{draft.bio}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content & Audience */}
        <div className={summaryCardClass}>
          <SectionHeader title="Content & Audience" step={4} onEdit={onEditStep} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
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
        <div className={summaryCardClass}>
          <SectionHeader title="Brand Preferences" step={5} onEdit={onEditStep} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            <Pills label="Campaign types" values={campaignTypeLabels} />
            <Pills label="Product types" values={productTypeLabels} color="purple" />
            {!campaignTypeLabels.length && !productTypeLabels.length && (
              <p className="py-2 text-xs text-[#8f97ab] italic">No preferences set</p>
            )}
          </div>
        </div>

        {/* Eligibility */}
        <div className={summaryCardClass}>
          <SectionHeader title="Eligibility" step={6} onEdit={onEditStep} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
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

      <div className="flex justify-end border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={onFinish}
          className="rounded-lg bg-[#99f7ff] px-7 py-2.5 text-sm font-bold text-slate-900 transition-opacity hover:opacity-90 shadow-[0_0_20px_rgba(153,247,255,0.22)]"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}