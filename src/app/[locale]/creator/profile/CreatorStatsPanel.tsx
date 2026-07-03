/**
 * CreatorStatsPanel — read-only panel showing all viewership stats pulled from
 * the database via OAuth. Creators cannot edit any of these values — they are
 * set exclusively by background OAuth syncs (`refreshTwitchDataIfStale` /
 * `refreshYouTubeDataIfStale`) or the Steam OpenID callback.
 *
 * Sections rendered (each conditionally, based on whether the account is linked):
 *  - Twitch: username, followers, paid subscribers, avg VOD views, channel age,
 *    last sync timestamp.
 *  - YouTube: channel name, handle, subscribers, avg views, watch time (30-day),
 *    member count, top categories, last sync timestamp.
 *  - Steam: username, SteamID, profile visibility, top games (by total hours),
 *    recent games (last 2 weeks), last sync timestamp.
 *  - Performance: CTR (click-through rate) derived from deal link clicks.
 *
 * Shown in Step 2 of the profile wizard. When no accounts are connected, renders
 * a placeholder message instead of empty sections.
 */
'use client'

import { useTranslations, useFormatter } from 'next-intl'

type StatRowProps = {
  label: string
  value: React.ReactNode
  highlight?: boolean
  tone?: 'default' | 'twitch' | 'youtube' | 'steam'
}

function StatRow({ label, value, highlight, tone = 'default' }: StatRowProps) {
  const dividerClass =
    tone === 'twitch' ? 'border-[#a970ff]/22' :
    tone === 'youtube' ? 'border-red-400/20' :
    tone === 'steam' ? 'border-[#66c0f4]/22' :
    'border-white/10'
  const labelClass =
    tone === 'twitch' ? 'text-[#b7a2d8]' :
    tone === 'youtube' ? 'text-[#c8a0a0]' :
    tone === 'steam' ? 'text-[#9bb8cf]' :
    'cr-text-muted-subtle'
  const valueClass = highlight
    ? tone === 'twitch'
      ? 'text-[#d8b4fe]'
      : tone === 'youtube'
        ? 'text-red-300'
        : tone === 'steam'
          ? 'text-[#bcdcf2]'
          : 'text-[#99f7ff]'
    : 'text-[#e8f4ff]'
  const placeholderClass =
    tone === 'twitch' ? 'text-[#a48fbf]' :
    tone === 'youtube' ? 'text-[#b79696]' :
    tone === 'steam' ? 'text-[#7a96aa]' :
    'cr-text-muted-subtle'

  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b py-2.5 last:border-0 ${dividerClass}`}>
      <span className={`text-xs ${labelClass}`}>{label}</span>
      <span className={`text-right text-xs font-semibold ${valueClass}`}>
        {value ?? <span className={`italic font-normal ${placeholderClass}`}>-</span>}
      </span>
    </div>
  )
}

type SteamGameEntry = {
  appId: number
  name: string
  hoursTotal?: number
  hoursRecent?: number
  playtimeMinutes?: number
  playtime2WeeksMinutes?: number
  iconUrl: string | null
}

type Props = {
  creator: {
    twitch_username: string | null
    twitch_broadcaster_type: string | null
    twitch_created_at: Date | null
    twitch_synced_at: Date | null
    subs_followers: number | null
    average_vod_views: number | null
    twitch_subscriber_count: number | null
    engagement_rate: number | null
    youtube_channel_id: string | null
    youtube_channel_name: string | null
    youtube_handle: string | null
    youtube_subscribers: number | null
    youtube_avg_views: number | null
    youtube_watch_time_hours: number | null
    youtube_member_count: number | null
    youtube_top_categories: string[]
    youtube_synced_at: Date | null
    steam_id: string | null
    steam_username: string | null
    steam_profile_visibility: number | null
    steam_top_games: unknown
    steam_recent_games: unknown
    steam_synced_at: Date | null
  }
}

export default function CreatorStatsPanel({ creator }: Props) {
  const t = useTranslations('creator.profile')
  const format = useFormatter()
  const fmt = (n: number | null | undefined): string | null => {
    if (n == null) return null
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return format.number(n)
  }
  const broadcasterLabel = (value: string): string => {
    if (value === 'partner') return t('statsPartner')
    if (value === 'affiliate') return t('statsAffiliate')
    if (value === 'none' || value === '') return t('statsStreamer')
    return value
  }
  const visibilityLabel = (value: number): string => {
    if (value === 3) return t('statsVisibilityPublic')
    if (value === 2) return t('statsVisibilityFriends')
    if (value === 1) return t('statsVisibilityPrivate')
    return '—'
  }
  const hasTwitch = !!creator.twitch_username
  const hasYouTube = !!creator.youtube_channel_id
  const hasSteam = !!creator.steam_id

  if (!hasTwitch && !hasYouTube && !hasSteam) {
    return (
      <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 text-center">
        <p className="text-sm cr-text-muted">
          {t('statsConnectPrompt')}
        </p>
      </div>
    )
  }

  const topGames = Array.isArray(creator.steam_top_games)
    ? (creator.steam_top_games as SteamGameEntry[])
    : []
  const recentGames = Array.isArray(creator.steam_recent_games)
    ? (creator.steam_recent_games as SteamGameEntry[])
    : []

  return (
    <div className="space-y-4">
      {hasTwitch && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-[#a970ff]/35 border-t-2 border-t-[#bffcff] bg-[radial-gradient(130%_170%_at_8%_0%,rgba(145,70,255,0.22)_0%,rgba(145,70,255,0.08)_36%,rgba(10,12,22,0.84)_76%)] shadow-[0_16px_48px_rgba(72,32,120,0.2)]">
          <div className="flex items-center gap-2 border-b border-[#a970ff]/25 bg-black/20 px-4 py-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#9146ff">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#d8b4fe]">{t('statsTwitch')}</span>
            <span className="ml-auto rounded-full border border-[#a970ff]/35 bg-[#a970ff]/10 px-2 py-0.5 text-nx-10 text-[#d8b4fe]">
              {creator.twitch_broadcaster_type
                ? broadcasterLabel(creator.twitch_broadcaster_type)
                : ''}
            </span>
          </div>
          <div className="px-4 py-1">
            <StatRow label={t('statsUsername')} value={`@${creator.twitch_username}`} tone="twitch" />
            <StatRow
              label={t('statsFollowers')}
              value={fmt(creator.subs_followers)}
              highlight={creator.subs_followers != null}
              tone="twitch"
            />
            <StatRow
              label={t('statsPaidSubs')}
              value={
                creator.twitch_subscriber_count != null
                  ? fmt(creator.twitch_subscriber_count)
                  : <span className="italic font-normal text-[#a48fbf] text-nx-11">-</span>
              }
              highlight={creator.twitch_subscriber_count != null}
              tone="twitch"
            />
            <StatRow
              label={t('statsAvgVodViews')}
              value={fmt(creator.average_vod_views)}
              highlight={creator.average_vod_views != null}
              tone="twitch"
            />
            {creator.twitch_created_at && (
              <StatRow
                label={t('statsChannelCreated')}
                value={format.dateTime(new Date(creator.twitch_created_at), 'monthYear')}
                tone="twitch"
              />
            )}
            {creator.twitch_synced_at && (
              <StatRow
                label={t('statsLastSynced')}
                value={format.dateTime(new Date(creator.twitch_synced_at), 'dateTimeMedium')}
                tone="twitch"
              />
            )}
          </div>
        </div>
      )}

      {hasYouTube && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-red-400/35 border-t-2 border-t-[#bffcff] bg-[radial-gradient(130%_170%_at_8%_0%,rgba(255,74,74,0.2)_0%,rgba(255,74,74,0.08)_36%,rgba(10,12,22,0.84)_76%)] shadow-[0_16px_48px_rgba(120,32,32,0.2)]">
          <div className="flex items-center gap-2 border-b border-red-400/25 bg-black/20 px-4 py-2.5">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="#ff4444">
              <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-red-300">{t('statsYoutube')}</span>
          </div>
          <div className="px-4 py-1">
            <StatRow label={t('statsChannel')} value={creator.youtube_channel_name ?? creator.youtube_handle} tone="youtube" />
            {creator.youtube_handle && (
              <StatRow label={t('statsHandle')} value={`${creator.youtube_handle}`} tone="youtube" />
            )}
            <StatRow
              label={t('statsSubscribers')}
              value={fmt(creator.youtube_subscribers)}
              highlight={creator.youtube_subscribers != null}
              tone="youtube"
            />
            <StatRow
              label={t('statsAvgViewsPerVideo')}
              value={fmt(creator.youtube_avg_views)}
              highlight={creator.youtube_avg_views != null}
              tone="youtube"
            />
            <StatRow
              label={t('statsWatchTime')}
              value={
                creator.youtube_watch_time_hours != null
                  ? format.number(creator.youtube_watch_time_hours)
                  : <span className="italic font-normal text-[#b79696] text-nx-11">-</span>
              }
              highlight={creator.youtube_watch_time_hours != null}
              tone="youtube"
            />
            <StatRow
              label={t('statsChannelMembers')}
              value={
                creator.youtube_member_count != null
                  ? fmt(creator.youtube_member_count)
                  : <span className="italic font-normal text-[#b79696] text-nx-11">-</span>
              }
              highlight={creator.youtube_member_count != null}
              tone="youtube"
            />
            {creator.youtube_top_categories.length > 0 && (
              <StatRow
                label={t('statsTopCategories')}
                value={creator.youtube_top_categories.join(', ')}
                tone="youtube"
              />
            )}
            {creator.youtube_synced_at && (
              <StatRow
                label={t('statsLastSynced')}
                value={format.dateTime(new Date(creator.youtube_synced_at), 'dateTimeMedium')}
                tone="youtube"
              />
            )}
          </div>
        </div>
      )}

      {hasSteam && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-[#66c0f4]/35 border-t-2 border-t-[#bffcff] bg-[radial-gradient(130%_170%_at_8%_0%,rgba(102,192,244,0.2)_0%,rgba(102,192,244,0.08)_36%,rgba(10,12,22,0.84)_76%)] shadow-[0_16px_48px_rgba(32,72,120,0.2)]">
          <div className="flex items-center gap-2 border-b border-[#66c0f4]/25 bg-black/20 px-4 py-2.5">
          <svg width="13" height="13" viewBox="0 0 32 32" fill="#66c0f4">
            <path fillRule="evenodd" clipRule="evenodd" d="M16 0C7.5 0 0.6 6.6 0 14.9l8.6 3.6c0.7-0.5 1.6-0.8 2.6-0.8 0.1 0 0.2 0 0.3 0l3.8-5.5c0-2.6 2.1-4.7 4.7-4.7 2.6 0 4.7 2.1 4.7 4.7 0 2.6-2.1 4.7-4.7 4.7-0.1 0-0.1 0-0.2 0l-5.4 3.9c0 0.1 0 0.2 0 0.3 0 2.5-2 4.5-4.5 4.5-2.2 0-4-1.5-4.4-3.6L0.4 19.5C2.3 26.6 8.5 32 16 32c8.8 0 16-7.2 16-16C32 7.2 24.8 0 16 0zM10 24.3l-1.9-0.8c0.3 0.7 0.9 1.3 1.7 1.6 1.7 0.7 3.6-0.1 4.3-1.8 0.3-0.8 0.3-1.7 0-2.5-0.3-0.8-1-1.4-1.7-1.7-0.8-0.3-1.6-0.3-2.3 0l2 0.8c1.2 0.5 1.8 1.9 1.3 3.1S11.2 24.8 10 24.3zM23.1 14.9c1.7 0 3.1-1.4 3.1-3.1 0-1.7-1.4-3.1-3.1-3.1-1.7 0-3.1 1.4-3.1 3.1C20 13.5 21.4 14.9 23.1 14.9zM23.1 9.4c1.3 0 2.4 1.1 2.4 2.4 0 1.3-1.1 2.4-2.4 2.4-1.3 0-2.4-1.1-2.4-2.4C20.7 10.5 21.8 9.4 23.1 9.4z"/>
          </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#bcdcf2]">{t('statsSteam')}</span>
            {creator.steam_profile_visibility != null && (
              <span className="ml-auto rounded-full border border-[#66c0f4]/35 bg-[#66c0f4]/10 px-2 py-0.5 text-nx-10 text-[#bcdcf2]">
                {visibilityLabel(creator.steam_profile_visibility)}
              </span>
            )}
          </div>
          <div className="px-4 py-1">
            <StatRow label={t('statsUsername')} value={creator.steam_username} tone="steam" />
            <StatRow
              label={t('statsSteamId')}
              value={
                <span className="font-mono text-nx-11">{creator.steam_id}</span>
              }
              tone="steam"
            />

            {topGames.length > 0 && (
              <div className="border-b border-[#66c0f4]/22 py-2.5">
                <div className="text-xs text-[#9bb8cf] mb-2">{t('statsTopGames')}</div>
                <ul className="space-y-1">
                  {topGames.slice(0, 5).map((g) => {
                    const hours = g.hoursTotal ?? (g.playtimeMinutes != null ? Math.round(g.playtimeMinutes / 60 * 10) / 10 : null)
                    return (
                      <li key={g.appId} className="flex items-center justify-between text-nx-11">
                        <span className="text-[#e8f4ff] truncate pr-2">{g.name}</span>
                        <span className="text-[#bcdcf2] font-semibold whitespace-nowrap">
                          {hours != null ? `${format.number(hours)} ${t('statsHrs')}` : '—'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {recentGames.length > 0 && (
              <div className="border-b border-[#66c0f4]/22 py-2.5">
                <div className="text-xs text-[#9bb8cf] mb-2">{t('statsRecentGames')}</div>
                <ul className="space-y-1">
                  {recentGames.slice(0, 5).map((g) => {
                    const hours = g.hoursRecent ?? (g.playtime2WeeksMinutes != null ? Math.round(g.playtime2WeeksMinutes / 60 * 10) / 10 : null)
                    return (
                      <li key={g.appId} className="flex items-center justify-between text-nx-11">
                        <span className="text-[#e8f4ff] truncate pr-2">{g.name}</span>
                        <span className="text-[#bcdcf2] font-semibold whitespace-nowrap">
                          {hours != null ? `${format.number(hours)} ${t('statsHrs')}` : '—'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {creator.steam_synced_at && (
              <StatRow
                label={t('statsLastSynced')}
                value={format.dateTime(new Date(creator.steam_synced_at), 'dateTimeMedium')}
                tone="steam"
              />
            )}
          </div>
        </div>
      )}

      {creator.engagement_rate != null && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-[#99f7ff]/30 border-t-2 border-t-[#bffcff] bg-[#99f7ff]/[0.06]">
          <div className="flex items-center gap-2 border-b border-[#99f7ff]/20 bg-black/20 px-4 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#99f7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#99f7ff]">{t('statsPerformanceTitle')}</span>
          </div>
          <div className="px-4 py-1">
            <StatRow
              label={t('statsCtrLabel')}
              value={`${Number(creator.engagement_rate).toFixed(2)}%`}
              highlight
            />
            <div className="py-2">
              <p className="text-nx-10 leading-relaxed cr-text-muted-subtle">
                {t('statsCtrDesc')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}