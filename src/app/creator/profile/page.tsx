/**
 * Creator Profile page (`/creator/profile`).
 *
 * Server component that orchestrates the profile setup experience:
 *  1. Enforces auth + role guard (creator or admin).
 *  2. Triggers background refresh of Twitch and YouTube stats when stale
 *     (staleness window defined per-platform in `_actions.ts`).
 *  3. Fetches the current profile draft (mixed from DB + Clerk metadata) and
 *     the creator's full OAuth stats row from the database.
 *  4. Renders `PayoutBanner` if Stripe Connect onboarding is incomplete.
 *  5. Renders `CreatorProfileWizard` which drives the 7-step profile flow.
 *
 * `isProfileComplete` is a heuristic that jumps users to the summary step
 * (step 7) when they have already set at least one meaningful field, avoiding
 * forcing them to re-step through the wizard on every visit.
 *
 * External services: Clerk (auth), Stripe (onboarding status check via DB),
 * Twitch API (background refresh), YouTube API (background refresh),
 * Prisma/PostgreSQL.
 *
 * Env vars (used indirectly via called functions):
 *  - `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
 *  - `YOUTUBE_API_KEY`
 *  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCreatorProfile, refreshTwitchDataIfStale, refreshYouTubeDataIfStale } from './_actions'
import CreatorProfileWizard from './CreatorProfileWizard'
import PayoutBanner from './PayoutBanner'
import { prisma } from '@/lib/prisma'
import { parseLocation } from '@/lib/location-options'
import type { CreatorProfileDraft } from './_shared'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorRouteShell from '@/components/creator/CreatorRouteShell'

/**
 * Returns true if the creator has completed enough of the profile wizard to
 * skip to the summary step. Any one of these being set is considered "complete":
 * creator_types, displayName, platform, or preferred_campaign_types.
 */
function isProfileComplete(draft: CreatorProfileDraft): boolean {
  return (
    draft.creator_types.length > 0 ||
    draft.displayName !== '' ||
    draft.platform.length > 0 ||
    draft.preferred_campaign_types.length > 0
  )
}

export default async function CreatorProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'creator' && role !== 'admin') redirect('/')

  await Promise.all([
    refreshTwitchDataIfStale(userId),
    refreshYouTubeDataIfStale(userId),
  ])

  const [{ displayName, username }, profile, creator] = await Promise.all([
    getUserDisplayInfo(),
    getCreatorProfile(),
    prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: {
        stripe_connect_id: true,
        stripe_onboarding_complete: true,
        twitch_username: true,
        twitch_broadcaster_type: true,
        twitch_profile_image: true,
        twitch_description: true,
        twitch_synced_at: true,
        youtube_handle: true,
        youtube_channel_name: true,
        youtube_subscribers: true,
        youtube_avg_views: true,
        youtube_top_categories: true,
        youtube_synced_at: true,
        twitch_created_at: true,
        subs_followers: true,
        average_vod_views: true,
        twitch_subscriber_count: true,
        engagement_rate: true,
        youtube_channel_id: true,
        youtube_watch_time_hours: true,
        youtube_member_count: true,
      },
    }),
  ])

  const initialDraft: CreatorProfileDraft = {
    displayName: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    country: profile?.country ?? '',
    state: profile?.state ?? '',
    city: profile?.city ?? '',
    language: profile?.language ?? [],
    creator_types: profile?.creator_types ?? [],
    primary_platform: profile?.primary_platform ?? '',
    platform: profile?.platform ?? [],
    game_category: profile?.game_category ?? [],
    content_style: profile?.content_style ?? [],
    content_type: profile?.categories ?? [],
    audience_interests: profile?.audience_interests ?? [],
    audience_gender: profile?.audience_gender ?? [],
    audience_age_min: profile?.audience_age_min?.toString() ?? '',
    audience_age_max: profile?.audience_age_max?.toString() ?? '',
    audience_locations: profile?.audience_locations ?? [],
    preferred_campaign_types: profile?.preferred_campaign_types ?? [],
    preferred_product_types: profile?.preferred_product_types ?? [],
    is_available: profile?.is_available ?? true,
    max_campaigns_per_month: profile?.max_campaigns_per_month?.toString() ?? '',
  }

  return (
    <CreatorRouteShell displayName={displayName} username={username} role={role}>
      <main className="w-full max-w-3xl mx-auto p-6 sm:p-8">
        <div className="dash-panel dash-panel--nx-top mb-6 rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4">
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Creator</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Creator Profile</h1>
          <p className="mt-1 text-sm text-[#a9abb5]">
            Complete your profile to get discovered by sponsors.
          </p>
        </div>

        {!creator?.stripe_onboarding_complete && (
          <PayoutBanner hasAccount={!!creator?.stripe_connect_id} />
        )}

        <CreatorProfileWizard
          initialDraft={initialDraft}
          initialStep={isProfileComplete(initialDraft) ? 7 : 1}
          twitchInitial={{
            username: creator?.twitch_username ?? null,
            broadcaster_type: creator?.twitch_broadcaster_type ?? null,
            profile_image: creator?.twitch_profile_image ?? null,
            description: creator?.twitch_description ?? null,
            synced_at: creator?.twitch_synced_at ?? null,
          }}
          youtubeInitial={{
            handle: creator?.youtube_handle ?? null,
            channel_name: creator?.youtube_channel_name ?? null,
            subscribers: creator?.youtube_subscribers ?? null,
            avg_views: creator?.youtube_avg_views ?? null,
            top_categories: creator?.youtube_top_categories ?? [],
            synced_at: creator?.youtube_synced_at ?? null,
          }}
          creatorStats={{
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
      </main>
    </CreatorRouteShell>
  )
}
