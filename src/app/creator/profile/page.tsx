import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCreatorProfile, refreshTwitchDataIfStale, refreshYouTubeDataIfStale } from './_actions'
import CreatorTopBar from '@/components/creator/CreatorTopBar'
import CreatorProfileForm from './CreatorProfileForm'
import Panel from '@/components/shared/Panel'
import TwitchConnect from '@/components/creator/TwitchConnect'
import YouTubeConnect from '@/components/creator/YoutubeConnect'
import CreatorStatsPanel from './CreatorStatsPanel'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'
import { prisma } from '@/lib/prisma'

export default async function CreatorProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'creator' && role !== 'admin') redirect('/')

  // Refresh stale Twitch data silently before render
  await Promise.all([
    refreshTwitchDataIfStale(userId),
    refreshYouTubeDataIfStale(userId),
  ])

  const [profile, creator] = await Promise.all([
    getCreatorProfile(),
    prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: {
        // Identity / connect cards
        twitch_username: true,
        twitch_broadcaster_type: true,
        twitch_profile_image: true,
        twitch_description: true,
        twitch_synced_at: true,
        youtube_handle: true,
        youtube_channel_name: true,
        youtube_synced_at: true,
        // Stats panel — all viewership fields
        twitch_created_at: true,
        subs_followers: true,
        average_vod_views: true,
        twitch_subscriber_count: true,
        engagement_rate: true,
        youtube_channel_id: true,
        youtube_subscribers: true,
        youtube_avg_views: true,
        youtube_watch_time_hours: true,
        youtube_member_count: true,
        youtube_top_categories: true,
      },
    }),
  ])

  return (
    <>
      <CreatorTopBar
        rightContent={
          <Link
            href="/creator"
            className="text-sm cr-text-muted hover:text-[#c8dff0] transition-colors"
          >
            ← Dashboard
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        {/* Twitch connection */}
        <Panel variant="creator" as="div" title="Connected Accounts" titleLevel={2}>
          <TwitchConnect
            initial={{
              username: creator?.twitch_username ?? null,
              broadcaster_type: creator?.twitch_broadcaster_type ?? null,
              profile_image: creator?.twitch_profile_image ?? null,
              description: creator?.twitch_description ?? null,
              synced_at: creator?.twitch_synced_at ?? null,
            }}
          />
          <YouTubeConnect
            initial={{
              handle: creator?.youtube_handle ?? null,
              channel_name: creator?.youtube_channel_name ?? null,
              subscribers: creator?.youtube_subscribers ?? null,
              avg_views: creator?.youtube_avg_views ?? null,
              top_categories: creator?.youtube_top_categories ?? [],
              synced_at: creator?.youtube_synced_at ?? null,
            }}
        />
        </Panel>

        {/* Combined profile form + viewership stats */}
        <Panel variant="creator" as="div" title="Creator Profile" titleLevel={1}>
          <p className="text-sm cr-text-muted mb-6">
            Manage your public profile. This info helps sponsors find and connect with you.
          </p>
          <CreatorProfileForm
            profile={profile}
            categoriesOptions={DEFAULT_CONTENT_CATEGORIES}
            twitchBroadcasterType={creator?.twitch_broadcaster_type ?? null}
          />

          {/* Viewership stats — read-only, verified via OAuth */}
          <div className="mt-8 pt-6 border-t cr-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="cr-panel-title mb-0">Viewership Stats</h2>
              <p className="text-xs cr-text-muted">Auto-synced · read only</p>
            </div>
            <CreatorStatsPanel
              creator={{
                twitch_username: creator?.twitch_username ?? null,
                twitch_broadcaster_type: creator?.twitch_broadcaster_type ?? null,
                twitch_created_at: creator?.twitch_created_at ?? null,
                twitch_synced_at: creator?.twitch_synced_at ?? null,
                subs_followers: creator?.subs_followers ?? null,
                average_vod_views: creator?.average_vod_views ?? null,
                twitch_subscriber_count: creator?.twitch_subscriber_count ?? null,
                engagement_rate: creator?.engagement_rate ?? null,
                youtube_channel_id: creator?.youtube_channel_id ?? null,
                youtube_channel_name: creator?.youtube_channel_name ?? null,
                youtube_handle: creator?.youtube_handle ?? null,
                youtube_subscribers: creator?.youtube_subscribers ?? null,
                youtube_avg_views: creator?.youtube_avg_views ?? null,
                youtube_watch_time_hours: creator?.youtube_watch_time_hours ?? null,
                youtube_member_count: creator?.youtube_member_count ?? null,
                youtube_top_categories: creator?.youtube_top_categories ?? [],
                youtube_synced_at: creator?.youtube_synced_at ?? null,
              }}
            />
          </div>
        </Panel>
      </main>
    </>
  )
}