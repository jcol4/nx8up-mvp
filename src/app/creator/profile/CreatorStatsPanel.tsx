/**
 * CreatorStatsPanel — read-only panel showing all viewership stats pulled from
 * the database via OAuth. Creators cannot edit any of these values — they are
 * set exclusively by background OAuth syncs (`refreshTwitchDataIfStale` /
 * `refreshYouTubeDataIfStale`).
 *
 * Sections rendered (each conditionally, based on whether the account is linked):
 *  - Twitch: username, followers, paid subscribers, avg VOD views, channel age,
 *    last sync timestamp.
 *  - YouTube: channel name, handle, subscribers, avg views, watch time (30-day),
 *    member count, top categories, last sync timestamp.
 *  - Performance: CTR (click-through rate) derived from deal link clicks.
 *
 * Shown in Step 2 of the profile wizard. When no accounts are connected, renders
 * a placeholder message instead of empty sections.
 */

type StatRowProps = {
  label: string
  value: React.ReactNode
  highlight?: boolean
  tone?: 'default' | 'twitch' | 'youtube'
}

function StatRow({ label, value, highlight, tone = 'default' }: StatRowProps) {
  const dividerClass =
    tone === 'twitch' ? 'border-[#a970ff]/22' : tone === 'youtube' ? 'border-red-400/20' : 'border-white/10'
  const labelClass =
    tone === 'twitch' ? 'text-[#b7a2d8]' : tone === 'youtube' ? 'text-[#c8a0a0]' : 'text-[#8f97ab]'
  const valueClass = highlight
    ? tone === 'twitch'
      ? 'text-[#d8b4fe]'
      : tone === 'youtube'
        ? 'text-red-300'
        : 'text-[#99f7ff]'
    : 'text-[#e8f4ff]'
  const placeholderClass =
    tone === 'twitch' ? 'text-[#a48fbf]' : tone === 'youtube' ? 'text-[#b79696]' : 'text-[#8f97ab]'

  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b py-2.5 last:border-0 ${dividerClass}`}>
      <span className={`text-xs ${labelClass}`}>{label}</span>
      <span className={`text-right text-xs font-semibold ${valueClass}`}>
        {value ?? <span className={`italic font-normal ${placeholderClass}`}>-</span>}
      </span>
    </div>
  )
}

/**
 * Formats a number to a compact K/M string for stat display.
 * Returns `null` for null/undefined inputs so callers can conditionally render.
 */
function fmt(n: number | null | undefined): string | null {
  if (n == null) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

type Props = {
  creator: {
    // Twitch
    twitch_username: string | null
    twitch_broadcaster_type: string | null
    twitch_created_at: Date | null
    twitch_synced_at: Date | null
    subs_followers: number | null
    average_vod_views: number | null
    twitch_subscriber_count: number | null
    engagement_rate: { toNumber(): number } | null
    // YouTube
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
}

const BROADCASTER_LABELS: Record<string, string> = {
  partner: 'Partner',
  affiliate: 'Affiliate',
  none: 'Streamer',
  '': 'Streamer',
}

export default function CreatorStatsPanel({ creator }: Props) {
  const hasTwitch = !!creator.twitch_username
  const hasYouTube = !!creator.youtube_channel_id

  if (!hasTwitch && !hasYouTube) {
    return (
      <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 text-center">
        <p className="text-sm text-[#a9abb5]">
          Connect Twitch or YouTube above to see your verified viewership stats here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Twitch stats */}
      {hasTwitch && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-[#a970ff]/35 border-t-2 border-t-[#bffcff] bg-[radial-gradient(130%_170%_at_8%_0%,rgba(145,70,255,0.22)_0%,rgba(145,70,255,0.08)_36%,rgba(10,12,22,0.84)_76%)] shadow-[0_16px_48px_rgba(72,32,120,0.2)]">
          <div className="flex items-center gap-2 border-b border-[#a970ff]/25 bg-black/20 px-4 py-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#9146ff">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#d8b4fe]">Twitch</span>
            <span className="ml-auto rounded-full border border-[#a970ff]/35 bg-[#a970ff]/10 px-2 py-0.5 text-[10px] text-[#d8b4fe]">
              {creator.twitch_broadcaster_type
                ? BROADCASTER_LABELS[creator.twitch_broadcaster_type] ?? creator.twitch_broadcaster_type
                : ''}
            </span>
          </div>
          <div className="px-4 py-1">
            <StatRow label="Username" value={`@${creator.twitch_username}`} tone="twitch" />
            <StatRow
              label="Followers"
              value={fmt(creator.subs_followers)}
              highlight={creator.subs_followers != null}
              tone="twitch"
            />
            <StatRow
              label="Paid subscribers"
              value={
                creator.twitch_subscriber_count != null
                  ? fmt(creator.twitch_subscriber_count)
                  : <span className="italic font-normal text-[#a48fbf] text-[11px]">-</span>
              }
              highlight={creator.twitch_subscriber_count != null}
              tone="twitch"
            />
            <StatRow
              label="Avg VOD views"
              value={fmt(creator.average_vod_views)}
              highlight={creator.average_vod_views != null}
              tone="twitch"
            />
            {creator.twitch_created_at && (
              <StatRow
                label="Channel created"
                value={new Date(creator.twitch_created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
                tone="twitch"
              />
            )}
            {creator.twitch_synced_at && (
              <StatRow
                label="Last synced"
                value={new Date(creator.twitch_synced_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                tone="twitch"
              />
            )}
          </div>
        </div>
      )}

      {/* YouTube stats */}
      {hasYouTube && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-red-400/35 border-t-2 border-t-[#bffcff] bg-[radial-gradient(130%_170%_at_8%_0%,rgba(255,74,74,0.2)_0%,rgba(255,74,74,0.08)_36%,rgba(10,12,22,0.84)_76%)] shadow-[0_16px_48px_rgba(120,32,32,0.2)]">
          <div className="flex items-center gap-2 border-b border-red-400/25 bg-black/20 px-4 py-2.5">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="#ff4444">
              <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-red-300">YouTube</span>
          </div>
          <div className="px-4 py-1">
            <StatRow label="Channel" value={creator.youtube_channel_name ?? creator.youtube_handle} tone="youtube" />
            {creator.youtube_handle && (
              <StatRow label="Handle" value={`${creator.youtube_handle}`} tone="youtube" />
            )}
            <StatRow
              label="Subscribers"
              value={fmt(creator.youtube_subscribers)}
              highlight={creator.youtube_subscribers != null}
              tone="youtube"
            />
            <StatRow
              label="Avg views per video"
              value={fmt(creator.youtube_avg_views)}
              highlight={creator.youtube_avg_views != null}
              tone="youtube"
            />
            <StatRow
              label="Watch time (30-day hrs)"
              value={
                creator.youtube_watch_time_hours != null
                  ? creator.youtube_watch_time_hours.toLocaleString()
                  : <span className="italic font-normal text-[#b79696] text-[11px]">-</span>
              }
              highlight={creator.youtube_watch_time_hours != null}
              tone="youtube"
            />
            <StatRow
              label="Channel members"
              value={
                creator.youtube_member_count != null
                  ? fmt(creator.youtube_member_count)
                  : <span className="italic font-normal text-[#b79696] text-[11px]">-</span>
              }
              highlight={creator.youtube_member_count != null}
              tone="youtube"
            />
            {creator.youtube_top_categories.length > 0 && (
              <StatRow
                label="Top categories"
                value={creator.youtube_top_categories.join(', ')}
                tone="youtube"
              />
            )}
            {creator.youtube_synced_at && (
              <StatRow
                label="Last synced"
                value={new Date(creator.youtube_synced_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                tone="youtube"
              />
            )}
          </div>
        </div>
      )}

      {/* CTR — derived from real link-click data, shown separately from platform stats */}
      {creator.engagement_rate != null && (
        <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-[#99f7ff]/30 border-t-2 border-t-[#bffcff] bg-[#99f7ff]/[0.06]">
          <div className="flex items-center gap-2 border-b border-[#99f7ff]/20 bg-black/20 px-4 py-2.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#99f7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#99f7ff]">Performance</span>
          </div>
          <div className="px-4 py-1">
            <StatRow
              label="Click-Through Rate (CTR)"
              value={`${Number(creator.engagement_rate).toFixed(2)}%`}
              highlight
            />
            <div className="py-2">
              <p className="text-[10px] leading-relaxed text-[#8f97ab]">
                Computed from actual link clicks across your sponsored campaigns — updated after each click.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
