/**
 * Creator Dashboard page (`/creator`).
 *
 * Server component that renders the main creator hub. Fetches all data in
 * parallel — XP state, calendar tasks, display info, and the creator's most
 * recent campaign applications — before rendering the four dashboard panels.
 *
 * Auth: requires a Clerk session with role "creator" or "admin" (enforced by
 * the layout). Unauthenticated users are never reached here.
 *
 * External services: Clerk (auth + publicMetadata for XP/calendar),
 * Prisma/PostgreSQL (campaign applications).
 *
 * Gotcha: campaign applications are fetched directly from the DB here (not via
 * a server action) to keep the parallel `Promise.all` in a single boundary.
 * Limit is hard-coded to 20 most-recent applications.
 */
import { auth } from "@clerk/nextjs/server";
import { getCreatorCalendarTasks, getCreatorXp } from "./_actions";
import { getUserDisplayInfo } from "@/lib/get-user-display-info";
import { CreatorCommandCenter } from "./_components";
import { prisma } from "@/lib/prisma";

/**
 * Renders the creator dashboard grid — missions, progress/calendar,
 * campaigns, and academy panels — for the authenticated creator.
 */
export default async function CreatorDashboardPage() {
  const [authResult, displayInfo, xpState, calendarTasks] =
    await Promise.all([
      auth(),
      getUserDisplayInfo(),
      getCreatorXp(),
      getCreatorCalendarTasks(),
    ]);

  const { userId } = authResult
  const role = (authResult.sessionClaims?.metadata as { role?: string } | undefined)?.role
  let campaignApplications: {
    id: string
    status: string
    submitted_at: Date | null
    campaign: {
      id: string
      title: string
      budget: number | null
      start_date: Date | null
      end_date: Date | null
      sponsor: { company_name: string | null }
    }
  }[] = []
  let openCampaigns: {
    id: string
    title: string
    budget: number | null
    end_date: Date | null
    sponsor: { company_name: string | null }
  }[] = []
  let creatorStats: {
    subs_followers: number | null
    average_vod_views: number | null
    twitch_username: string | null
    youtube_channel_name: string | null
  } | null = null
  let statsUnavailable = false

  if (userId) {
    try {
      // Use the same stable lookup path as the older layout: lookup creator by unique clerk_user_id.
      const creator = await prisma.content_creators.findUnique({
        where: { clerk_user_id: userId },
        select: {
          id: true,
          subs_followers: true,
          average_vod_views: true,
          twitch_username: true,
          youtube_channel_name: true,
        },
      })

      creatorStats = creator
        ? {
          subs_followers: creator.subs_followers,
          average_vod_views: creator.average_vod_views,
          twitch_username: creator.twitch_username,
          youtube_channel_name: creator.youtube_channel_name,
        }
        : null

      if (creator?.id) {
        campaignApplications = await prisma.campaign_applications.findMany({
          where: { creator_id: creator.id },
          select: {
            id: true,
            status: true,
            submitted_at: true,
            campaign: {
              select: {
                id: true,
                title: true,
                budget: true,
                start_date: true,
                end_date: true,
                sponsor: { select: { company_name: true } },
              },
            },
          },
          orderBy: { submitted_at: 'desc' },
          take: 20,
        })
      }

      openCampaigns = await prisma.campaigns.findMany({
        where: { status: 'live', is_direct_invite: false },
        select: {
          id: true,
          title: true,
          budget: true,
          end_date: true,
          sponsor: { select: { company_name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 3,
      })
    } catch (error) {
      console.error('Creator dashboard DB query failed:', error)
      // Graceful fallback: still render dashboard with empty applications/stats.
      campaignApplications = []
      openCampaigns = []
      creatorStats = null
      statsUnavailable = true
    }
  }
  const { displayName, username } = displayInfo;

  return (
    <CreatorCommandCenter
      displayName={displayName || username || 'Creator'}
      level={xpState.level}
      rankName={xpState.rankName}
      xp={xpState.xp}
      xpForNext={xpState.xpForNext}
      applications={campaignApplications}
      openCampaigns={openCampaigns}
      creatorStats={{
        twitchFollowers: creatorStats?.subs_followers ?? null,
        averageVodViews: creatorStats?.average_vod_views ?? null,
        twitchUsername: creatorStats?.twitch_username ?? null,
        youtubeChannelName: creatorStats?.youtube_channel_name ?? null,
      }}
      statsUnavailable={statsUnavailable}
      isAdmin={role === 'admin'}
      calendarTasks={calendarTasks}
    />
  );
}
