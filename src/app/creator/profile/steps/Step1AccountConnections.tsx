// /**
//  * Step 1 — Account Connections (profile wizard).
//  *
//  * Renders the Twitch and YouTube OAuth connection widgets wrapped in
//  * `<Suspense>` boundaries with a pulsing skeleton fallback.
//  *
//  * This step is intentionally read/write agnostic — it does not touch the
//  * `draft` state and has no save action. The "Next" button simply advances
//  * the wizard without persisting anything.
//  *
//  * OAuth linking is handled by dedicated routes:
//  *  - Twitch: `/api/auth/twitch` (OAuth redirect) via `TwitchConnect`
//  *  - YouTube: `/api/auth/google` (OAuth redirect) via `YouTubeConnect`
//  */
// 'use client'

// import { Suspense } from 'react'
// import TwitchConnect from '@/components/creator/TwitchConnect'
// import YouTubeConnect from '@/components/creator/YoutubeConnect'

// type TwitchData = {
//   username: string | null
//   broadcaster_type: string | null
//   profile_image: string | null
//   description: string | null
//   synced_at: Date | null
// }

// type YouTubeData = {
//   handle: string | null
//   channel_name: string | null
//   subscribers: number | null
//   avg_views: number | null
//   top_categories: string[]
//   synced_at: Date | null
// }

// type Props = {
//   twitchInitial: TwitchData
//   youtubeInitial: YouTubeData
//   onNext: () => void
// }

// export default function Step1AccountConnections({ twitchInitial, youtubeInitial, onNext }: Props) {
//   return (
//     <div className="space-y-4">
//       <p className="text-sm cr-text-muted mb-4">
//         Connect your accounts so NX8UP can verify your reach and sync your stats automatically.
//       </p>

//       <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
//         <TwitchConnect initial={twitchInitial} />
//       </Suspense>

//       <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
//         <YouTubeConnect initial={youtubeInitial} />
//       </Suspense>

//       <div className="flex justify-end pt-2">
//         <button
//           type="button"
//           onClick={onNext}
//           className="py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   )
// }



'use client'

import { Suspense } from 'react'
import TwitchConnect from '@/components/creator/TwitchConnect'
import YouTubeConnect from '@/components/creator/YoutubeConnect'
import SteamConnect from '@/components/creator/SteamConnect'
import ProfilePictureUpload from '@/components/shared/ProfilePictureUpload'

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

type SteamData = {
  steam_id: string | null
  steam_username: string | null
  steam_profile_url: string | null
  steam_avatar_url: string | null
  steam_profile_visibility: number | null
  steam_synced_at: Date | null
}

type Props = {
  twitchInitial: TwitchData
  youtubeInitial: YouTubeData
  steamInitial: SteamData
  onNext: () => void
}

export default function Step1AccountConnections({ twitchInitial, youtubeInitial, steamInitial, onNext }: Props) {
  return (
    <div className="space-y-4">
      <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4">
        <p className="mb-3 font-headline text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99f7ff]">Profile Picture</p>
        <ProfilePictureUpload />
      </div>

      <p className="text-sm cr-text-muted mb-4">
        Connect your accounts so NX8UP can verify your reach and sync your stats automatically.
      </p>

      <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
        <TwitchConnect initial={twitchInitial} />
      </Suspense>

      <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
        <YouTubeConnect initial={youtubeInitial} />
      </Suspense>

      <Suspense fallback={<div className="h-32 rounded-lg bg-white/[0.02] border border-white/5 animate-pulse" />}>
        <SteamConnect initial={steamInitial} />
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