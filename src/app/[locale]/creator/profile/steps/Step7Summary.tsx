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

import { useTranslations } from 'next-intl'
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
  steam_username: string | null
  steam_profile_url: string | null
  steam_avatar_url: string | null
  steam_profile_visibility: number | null
  steam_synced_at: Date | null
}

type CreatorStats = {
  twitch_username: string | null
  subs_followers: number | null
  average_vod_views: number | null
  twitch_subscriber_count: number | null
  engagement_rate: number | null
  twitch_synced_at: Date | null
  youtube_channel_name: string | null
  youtube_handle: string | null
  youtube_subscribers: number | null
  youtube_avg_views: number | null
  youtube_watch_time_hours: number | null
  youtube_synced_at: Date | null
  steam_id: string | null
  steam_username: string | null
  steam_profile_visibility: number | null
  steam_top_games: unknown
  steam_recent_games: unknown
  steam_synced_at: Date | null
}

type Props = {
  draft: CreatorProfileDraft
  twitchInitial: TwitchData
  youtubeInitial: YouTubeData
  steamInitial: SteamData
  creatorStats: CreatorStats
  onEditStep: (step: number) => void
  onBack: () => void
  onFinish: () => void
}

const summaryCardClass =
  'rounded-xl border border-white/16 bg-[linear-gradient(90deg,rgba(153,247,255,0.95),rgba(153,247,255,0.22))] bg-[length:100%_2px] bg-no-repeat bg-[position:top_left] bg-black/20 shadow-[inset_0_1px_0_rgba(153,247,255,0.28)] p-3 sm:p-4'

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-white/18 py-2.5 last:border-0">
      <span className="shrink-0 text-xs cr-text-muted-subtle">{label}</span>
      <span className="text-right text-xs text-[#e8f4ff]">{value}</span>
    </div>
  )
}

function Pills({ label, values, color = 'cyan' }: { label: string; values: string[]; color?: 'cyan' | 'purple' }) {
  if (!values.length) return null
  const chip = color === 'purple'
    ? 'rounded border border-[#c084fc]/35 bg-[#c084fc]/15 px-1.5 py-0.5 text-nx-10 text-[#d8b4fe]'
    : 'rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-1.5 py-0.5 text-nx-10 text-[#99f7ff]'
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-white/18 py-2.5 last:border-0">
      <span className="shrink-0 text-xs cr-text-muted-subtle">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {values.map(v => <span key={v} className={chip}>{v}</span>)}
      </div>
    </div>
  )
}

function SectionHeader({ title, step, onEdit, editLabel }: { title: string; step: number; onEdit: (s: number) => void; editLabel: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="font-headline text-nx-11 font-semibold uppercase tracking-[0.2em] text-[#99f7ff]">{title}</p>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="text-xs font-medium text-[#99f7ff] transition-opacity hover:opacity-80"
      >
        {editLabel}
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

export default function Step7Summary({
  draft,
  twitchInitial,
  youtubeInitial,
  steamInitial,
  creatorStats,
  onEditStep,
  onBack,
  onFinish,
}: Props) {
  const t = useTranslations('creator.profile')
  const tEnum = useTranslations('enums')
  const creatorTypeLabels = CREATOR_TYPE_OPTIONS
    .filter(o => draft.creator_types.includes(o.value))
    .map(o => tEnum(`creatorType.${o.value}.label`))

  const campaignTypeLabels = PREFERRED_CAMPAIGN_TYPE_OPTIONS
    .filter(o => draft.preferred_campaign_types.includes(o.value))
    .map(o => tEnum(`creatorCampaignType.${o.value}.label`))

  const productTypeLabels = PREFERRED_PRODUCT_TYPE_OPTIONS
    .filter(o => draft.preferred_product_types.includes(o.value))
    .map(o => tEnum(`creatorProductType.${o.value}.label`))

  const locationStr = [draft.city, draft.state, draft.country].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs cr-text-muted">
        {t('s7Desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Accounts */}
        <div className={summaryCardClass}>
          <SectionHeader title={t('s7AccountsTitle')} step={1} onEdit={onEditStep} editLabel={t('s7Edit')} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3 space-y-3">
            {/* Twitch */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="#9146ff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>
              {twitchInitial.username ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#e8f4ff] truncate block">{twitchInitial.username}</span>
                  {twitchInitial.broadcaster_type && (
                    <span className="text-nx-10 cr-text-muted-subtle capitalize">{twitchInitial.broadcaster_type || 'Standard'}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs cr-text-muted-subtle italic">{t('s7NotConnected')}</span>
              )}
              {twitchInitial.username && (
                <span className="shrink-0 rounded border border-[#a970ff]/35 bg-[#a970ff]/12 px-1.5 py-0.5 text-nx-10 text-[#d8b4fe]">{t('s7Connected')}</span>
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
                    <span className="text-nx-10 cr-text-muted-subtle">{youtubeInitial.handle}</span>
                  )}
                </div>
              ) : (
                <span className="text-xs cr-text-muted-subtle italic">{t('s7NotConnected')}</span>
              )}
              {(youtubeInitial.channel_name || youtubeInitial.handle) && (
                <span className="shrink-0 rounded border border-red-500/35 bg-red-500/10 px-1.5 py-0.5 text-nx-10 text-red-300">{t('s7Connected')}</span>
              )}
            </div>
            <div className="border-t border-white/18" />
            {/* Steam */}
            <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 32 32" fill="#66c0f4"><path fillRule="evenodd" clipRule="evenodd" d="M16 0C7.5 0 0.6 6.6 0 14.9l8.6 3.6c0.7-0.5 1.6-0.8 2.6-0.8 0.1 0 0.2 0 0.3 0l3.8-5.5c0-2.6 2.1-4.7 4.7-4.7 2.6 0 4.7 2.1 4.7 4.7 0 2.6-2.1 4.7-4.7 4.7-0.1 0-0.1 0-0.2 0l-5.4 3.9c0 0.1 0 0.2 0 0.3 0 2.5-2 4.5-4.5 4.5-2.2 0-4-1.5-4.4-3.6L0.4 19.5C2.3 26.6 8.5 32 16 32c8.8 0 16-7.2 16-16C32 7.2 24.8 0 16 0zM10 24.3l-1.9-0.8c0.3 0.7 0.9 1.3 1.7 1.6 1.7 0.7 3.6-0.1 4.3-1.8 0.3-0.8 0.3-1.7 0-2.5-0.3-0.8-1-1.4-1.7-1.7-0.8-0.3-1.6-0.3-2.3 0l2 0.8c1.2 0.5 1.8 1.9 1.3 3.1S11.2 24.8 10 24.3zM23.1 14.9c1.7 0 3.1-1.4 3.1-3.1 0-1.7-1.4-3.1-3.1-3.1-1.7 0-3.1 1.4-3.1 3.1C20 13.5 21.4 14.9 23.1 14.9zM23.1 9.4c1.3 0 2.4 1.1 2.4 2.4 0 1.3-1.1 2.4-2.4 2.4-1.3 0-2.4-1.1-2.4-2.4C20.7 10.5 21.8 9.4 23.1 9.4z"/></svg>
              {steamInitial.steam_id ? (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#e8f4ff] truncate block">{steamInitial.steam_username ?? 'Steam User'}</span>
                  <span className="text-nx-10 cr-text-muted-subtle font-mono">{steamInitial.steam_id}</span>
                </div>
              ) : (
                <span className="text-xs cr-text-muted-subtle italic">{t('s7NotConnected')}</span>
              )}
              {steamInitial.steam_id && (
                <span className="shrink-0 rounded border border-[#66c0f4]/35 bg-[#66c0f4]/10 px-1.5 py-0.5 text-nx-10 text-[#bcdcf2]">{t('s7Connected')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className={summaryCardClass}>
          <SectionHeader title={t('s7MetricsTitle')} step={2} onEdit={onEditStep} editLabel={t('s7Edit')} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            {creatorStats.twitch_username && (
              <>
                <p className="mb-1.5 text-nx-10 font-semibold uppercase tracking-widest cr-text-muted-subtle">{t('s7TwitchLabel')}</p>
                <Row label={t('s7RowFollowers')} value={fmt(creatorStats.subs_followers)} />
                <Row label={t('s7RowSubscribers')} value={fmt(creatorStats.twitch_subscriber_count)} />
                <Row label={t('s7RowAvgVodViews')} value={fmt(creatorStats.average_vod_views)} />
                {creatorStats.engagement_rate != null && (
                  <Row label={t('s7RowCtr')} value={`${Number(creatorStats.engagement_rate).toFixed(2)}%`} />
                )}
              </>
            )}
            {creatorStats.youtube_channel_name && (
              <>
                {creatorStats.twitch_username && <div className="my-2 border-t border-white/18" />}
                <p className="mb-1.5 text-nx-10 font-semibold uppercase tracking-widest cr-text-muted-subtle">{t('s7YoutubeLabel')}</p>
                <Row label={t('s7RowSubscribers')} value={fmt(creatorStats.youtube_subscribers)} />
                <Row label={t('s7RowAvgViews')} value={fmt(creatorStats.youtube_avg_views)} />
                {creatorStats.youtube_watch_time_hours != null && (
                  <Row label={t('s7RowWatchTime')} value={`${fmt(creatorStats.youtube_watch_time_hours)}h`} />
                )}
              </>
            )}
            {!creatorStats.twitch_username && !creatorStats.youtube_channel_name && (
              <p className="py-2 text-xs cr-text-muted-subtle italic">{t('s7NoAccountsConnected')}</p>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className={summaryCardClass}>
          <SectionHeader title={t('s7IdentityTitle')} step={3} onEdit={onEditStep} editLabel={t('s7Edit')} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            <Row label={t('s7RowDisplayName')} value={draft.displayName || '—'} />
            <Row label={t('s7RowLocation')} value={locationStr || undefined} />
            <Pills label={t('s7RowLanguages')} values={draft.language} />
            <Pills label={t('s7RowCreatorType')} values={creatorTypeLabels} />
            <Row label={t('s7RowPrimaryPlatform')} value={draft.primary_platform || undefined} />
            {draft.bio && (
              <div className="border-b border-white/10 py-2.5 last:border-0">
                <span className="mb-1 block text-xs cr-text-muted-subtle">{t('s7RowBio')}</span>
                <span className="line-clamp-3 text-xs leading-relaxed text-[#e8f4ff]">{draft.bio}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content & Audience */}
        <div className={summaryCardClass}>
          <SectionHeader title={t('s7ContentAudienceTitle')} step={4} onEdit={onEditStep} editLabel={t('s7Edit')} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            <Pills label={t('s7RowPlatforms')} values={draft.platform} />
            <Pills label={t('s7RowGameGenres')} values={draft.game_category} />
            <Pills label={t('s7RowContentStyle')} values={draft.content_style} />
            <Pills label={t('s7RowCategories')} values={draft.content_type} />
            <Pills label={t('s7RowAudienceInterests')} values={draft.audience_interests} color="purple" />
            <Pills label={t('s7RowAudienceGender')} values={draft.audience_gender} />
            {(draft.audience_age_min || draft.audience_age_max) && (
              <Row
                label={t('s7RowAudienceAge')}
                value={[draft.audience_age_min, draft.audience_age_max].filter(Boolean).join(' – ')}
              />
            )}
            <Pills label={t('s7RowAudienceLocations')} values={draft.audience_locations} />
          </div>
        </div>

        {/* Brand preferences */}
        <div className={summaryCardClass}>
          <SectionHeader title={t('s7BrandsTitle')} step={5} onEdit={onEditStep} editLabel={t('s7Edit')} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            <Pills label={t('s7RowCampaignTypes')} values={campaignTypeLabels} />
            <Pills label={t('s7RowProductTypes')} values={productTypeLabels} color="purple" />
            {!campaignTypeLabels.length && !productTypeLabels.length && (
              <p className="py-2 text-xs cr-text-muted-subtle italic">{t('s7NoPreferences')}</p>
            )}
          </div>
        </div>

        {/* Eligibility */}
        <div className={summaryCardClass}>
          <SectionHeader title={t('s7EligibilityTitle')} step={6} onEdit={onEditStep} editLabel={t('s7Edit')} />
          <div className="rounded-lg border border-white/16 bg-black/25 p-3">
            <Row
              label={t('s7AvailabilityLabel')}
              value={draft.is_available ? t('s7AvailableStatus') : t('s7NotAvailableStatus')}
            />
            <Row
              label={t('s7MaxCampaignsLabel')}
              value={draft.max_campaigns_per_month || t('s7NoLimit')}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium cr-text-muted transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]"
        >
          {t('s7Back')}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="rounded-lg bg-[#99f7ff] px-7 py-2.5 text-sm font-bold text-slate-900 transition-opacity hover:opacity-90 shadow-[0_0_20px_rgba(153,247,255,0.22)]"
        >
          {t('s7GoToDashboard')}
        </button>
      </div>
    </div>
  )
}