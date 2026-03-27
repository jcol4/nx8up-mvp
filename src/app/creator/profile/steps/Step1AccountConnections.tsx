'use client'

import { Suspense } from 'react'
import TwitchConnect from '@/components/creator/TwitchConnect'
import YouTubeConnect from '@/components/creator/YoutubeConnect'

type TwitchData = {
  username: string | null
  broadcaster_type: string | null
  profile_image: string | null
  description: string | null
  synced_at: Date | null
}

type YouTubeData = {
  handle: string | null
  channel_name: string | null
  subscribers: number | null
  avg_views: number | null
  top_categories: string[]
  synced_at: Date | null
}

type Props = {
  twitchInitial: TwitchData
  youtubeInitial: YouTubeData
  onNext: () => void
}

export default function Step1AccountConnections({ twitchInitial, youtubeInitial, onNext }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm cr-text-muted mb-4">
        Connect your accounts so NX8UP can verify your reach and sync your stats automatically.
      </p>

      <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
        <TwitchConnect initial={twitchInitial} />
      </Suspense>

      <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
        <YouTubeConnect initial={youtubeInitial} />
      </Suspense>

      <div className="flex justify-end pt-2">
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
