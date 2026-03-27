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
      <p className="text-sm cr-text-muted mb-4">
        These stats are synced automatically from your connected accounts. They are read-only and verified by NX8UP.
      </p>

      <CreatorStatsPanel creator={creator} />

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-5 rounded-lg border border-white/10 cr-text-muted text-sm font-medium hover:text-[#c8dff0] hover:border-white/20 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  )
}
