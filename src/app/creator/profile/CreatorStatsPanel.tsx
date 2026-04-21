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
}

function StatRow({ label, value, highlight }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs cr-text-muted">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-[#00c8ff]' : 'cr-text-bright'}`}>
        {value ?? <span className="cr-text-muted italic font-normal">-</span>}
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
      <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-center">
        <p className="text-sm cr-text-muted">
          Connect Twitch or YouTube above to see your verified viewership stats here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Twitch stats */}
      {hasTwitch && (
        <div className="rounded-lg border border-[rgba(145,70,255,0.15)] bg-[rgba(145,70,255,0.03)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(145,70,255,0.1)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#9146ff">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#9146ff]">Twitch</span>
            <span className="ml-auto text-[10px] cr-text-muted">
              {creator.twitch_broadcaster_type
                ? BROADCASTER_LABELS[creator.twitch_broadcaster_type] ?? creator.twitch_broadcaster_type
                : ''}
            </span>
          </div>
          <div className="px-4 py-1">
            <StatRow label="Username" value={`@${creator.twitch_username}`} />
            <StatRow
              label="Followers"
              value={fmt(creator.subs_followers)}
              highlight={creator.subs_followers != null}
            />
            <StatRow
              label="Paid subscribers"
              value={
                creator.twitch_subscriber_count != null
                  ? fmt(creator.twitch_subscriber_count)
                  : <span className="cr-text-muted italic font-normal text-[11px]">-</span>
              }
              highlight={creator.twitch_subscriber_count != null}
            />
            <StatRow
              label="Avg VOD views"
              value={fmt(creator.average_vod_views)}
              highlight={creator.average_vod_views != null}
            />
            {creator.twitch_created_at && (
              <StatRow
                label="Channel created"
                value={new Date(creator.twitch_created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
              />
            )}
            {creator.twitch_synced_at && (
              <StatRow
                label="Last synced"
                value={new Date(creator.twitch_synced_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
            )}
          </div>
        </div>
      )}

      {/* YouTube stats */}
      {hasYouTube && (
        <div className="rounded-lg border border-[rgba(255,68,68,0.15)] bg-[rgba(255,68,68,0.03)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(255,68,68,0.1)]">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="#ff4444">
              <path d="M15.666 1.877A2.013 2.013 0 0 0 14.254.452C13.013.116 8 .116 8 .116s-5.013 0-6.254.336A2.013 2.013 0 0 0 .334 1.877C0 3.13 0 5.75 0 5.75s0 2.62.334 3.873A2.013 2.013 0 0 0 1.746 11.048C2.987 11.384 8 11.384 8 11.384s5.013 0 6.254-.336a2.013 2.013 0 0 0 1.412-1.425C16 8.37 16 5.75 16 5.75s0-2.62-.334-3.873ZM6.386 8.25V3.25L10.545 5.75 6.386 8.25Z"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#ff4444]">YouTube</span>
          </div>
          <div className="px-4 py-1">
            <StatRow label="Channel" value={creator.youtube_channel_name ?? creator.youtube_handle} />
            {creator.youtube_handle && (
              <StatRow label="Handle" value={`${creator.youtube_handle}`} />
            )}
            <StatRow
              label="Subscribers"
              value={fmt(creator.youtube_subscribers)}
              highlight={creator.youtube_subscribers != null}
            />
            <StatRow
              label="Avg views per video"
              value={fmt(creator.youtube_avg_views)}
              highlight={creator.youtube_avg_views != null}
            />
            <StatRow
              label="Watch time (30-day hrs)"
              value={
                creator.youtube_watch_time_hours != null
                  ? creator.youtube_watch_time_hours.toLocaleString()
                  : <span className="cr-text-muted italic font-normal text-[11px]">-</span>
              }
              highlight={creator.youtube_watch_time_hours != null}
            />
            <StatRow
              label="Channel members"
              value={
                creator.youtube_member_count != null
                  ? fmt(creator.youtube_member_count)
                  : <span className="cr-text-muted italic font-normal text-[11px]">-</span>
              }
              highlight={creator.youtube_member_count != null}
            />
            {creator.youtube_top_categories.length > 0 && (
              <StatRow
                label="Top categories"
                value={creator.youtube_top_categories.join(', ')}
              />
            )}
            {creator.youtube_synced_at && (
              <StatRow
                label="Last synced"
                value={new Date(creator.youtube_synced_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
            )}
          </div>
        </div>
      )}

      {/* CTR — derived from real link-click data, shown separately from platform stats */}
      {creator.engagement_rate != null && (
        <div className="rounded-lg border border-[rgba(0,200,255,0.2)] bg-[rgba(0,200,255,0.04)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(0,200,255,0.1)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00c8ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase text-[#00c8ff]">Performance</span>
          </div>
          <div className="px-4 py-1">
            <StatRow
              label="Click-Through Rate (CTR)"
              value={`${Number(creator.engagement_rate).toFixed(2)}%`}
              highlight
            />
            <div className="py-2">
              <p className="text-[10px] cr-text-muted leading-relaxed">
                Computed from actual link clicks across your sponsored campaigns — updated after each click.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
