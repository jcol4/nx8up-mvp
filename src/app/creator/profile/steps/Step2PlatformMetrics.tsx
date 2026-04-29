/**
 * Step 2 — Platform Metrics (profile wizard).
 *
 * Read-only display step that shows synced Twitch and YouTube stats via
 * `CreatorStatsPanel`. Stats are fetched server-side before the wizard
 * renders and passed as the `creator` prop.
 *
 * This step has no save action — navigating forward/back simply changes the
 * active step in the wizard without persisting any data.
 */
import CreatorStatsPanel from '../CreatorStatsPanel'

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
  creator: CreatorStats
  onNext: () => void
  onBack: () => void
}

export default function Step2PlatformMetrics({ creator, onNext, onBack }: Props) {
  return (
    <div className="space-y-4">
      <p className="mb-4 text-sm text-[#a9abb5] leading-relaxed">
        These stats are synced automatically from your connected accounts. They are read-only and verified by NX8UP.
      </p>

      <CreatorStatsPanel creator={creator} />

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-[#99f7ff] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-opacity hover:opacity-90"
        >
          Next
        </button>
      </div>
    </div>
  )
}
