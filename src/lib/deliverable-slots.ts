/**
 * Expands a campaign's per-type deliverable counts into an ordered list of
 * individually labeled slots (e.g. "YouTube Video 1", "YouTube Video 2",
 * "Twitch Stream 1"), used to render fixed, labeled proof-submission rows in
 * the Deal Room and to remind creators what's owed on the deal room page.
 *
 * Only the four count fields with a direct entry in `MEDIA_TYPE_PLATFORM`
 * are covered — `num_posts` / `num_short_videos` have no platform mapping
 * and are intentionally left out.
 */
import { MEDIA_TYPE_PLATFORM, type SupportedPlatform } from '@/lib/platforms'

export type DeliverableType = 'youtube_video' | 'youtube_short' | 'twitch_stream' | 'twitch_clip'

export type DeliverableSlot = {
  type: DeliverableType
  label: string
  platform: SupportedPlatform
}

const SLOT_DEFS: { type: DeliverableType; countKey: keyof DeliverableCampaignInput; label: string }[] = [
  { type: 'youtube_video', countKey: 'num_videos', label: 'YouTube Video' },
  { type: 'youtube_short', countKey: 'num_youtube_shorts', label: 'YouTube Short' },
  { type: 'twitch_stream', countKey: 'num_streams', label: 'Twitch Stream' },
  { type: 'twitch_clip', countKey: 'num_twitch_clips', label: 'Twitch Clip' },
]

export type DeliverableCampaignInput = {
  num_videos: number | null
  num_youtube_shorts: number | null
  num_streams: number | null
  num_twitch_clips: number | null
}

export function buildDeliverableSlots(campaign: DeliverableCampaignInput): DeliverableSlot[] {
  const slots: DeliverableSlot[] = []
  for (const { type, countKey, label } of SLOT_DEFS) {
    const count = campaign[countKey] ?? 0
    for (let i = 1; i <= count; i++) {
      slots.push({ type, label: count > 1 ? `${label} ${i}` : label, platform: MEDIA_TYPE_PLATFORM[type] })
    }
  }
  return slots
}
