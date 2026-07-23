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
import { getCreatorCalendarTasks, getCreatorXp, getCreatorMissions } from "./_actions";
import {
  getOpenCampaignsWithEligibility,
  getMyInvitations,
  getPendingApplications,
  getActiveCampaigns,
} from "./campaigns/_actions";
import { getUserDisplayInfo } from "@/lib/get-user-display-info";
import { CreatorCommandCenter } from "./_components";
import { prisma } from "@/lib/prisma";
import { maybeGrantReferralReward } from "@/lib/reputation";

/**
 * Renders the creator dashboard grid — missions, progress/calendar,
 * campaigns, and academy panels — for the authenticated creator.
 */
export default async function CreatorDashboardPage() {
  const [authResult, displayInfo, xpState, calendarTasks, missions] =
    await Promise.all([
      auth(),
      getUserDisplayInfo(),
      getCreatorXp(),
      getCreatorCalendarTasks(),
      getCreatorMissions(),
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
      status: string
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
  // Minimal, fully-serializable shape for the (client) dashboard panel. The raw
  // action results can contain Prisma Decimal fields (e.g. min_engagement_rate on
  // the full campaign from getMyInvitations), which cannot cross the
  // server→client boundary, so we project down to plain values here.
  type PanelApplication = {
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
  }
  const toPanelApplication = (a: {
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
  }): PanelApplication => ({
    id: a.id,
    status: a.status,
    submitted_at: a.submitted_at,
    campaign: {
      id: a.campaign.id,
      title: a.campaign.title,
      budget: a.campaign.budget,
      start_date: a.campaign.start_date,
      end_date: a.campaign.end_date,
      sponsor: { company_name: a.campaign.sponsor.company_name },
    },
  })
  let invitedApplications: PanelApplication[] = []
  let pendingApplications: PanelApplication[] = []
  let activeApplications: PanelApplication[] = []
  let creatorStats: {
    subs_followers: number | null
    average_vod_views: number | null
    twitch_username: string | null
    youtube_channel_name: string | null
    platform: string[]
    stripe_onboarding_complete: boolean
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
          platform: true,
          stripe_onboarding_complete: true,
        },
      })

      if (creator?.id) void maybeGrantReferralReward(creator.id)

      creatorStats = creator
        ? {
          subs_followers: creator.subs_followers,
          average_vod_views: creator.average_vod_views,
          twitch_username: creator.twitch_username,
          youtube_channel_name: creator.youtube_channel_name,
          platform: creator.platform,
          stripe_onboarding_complete: creator.stripe_onboarding_complete,
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
                status: true,
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

      // The dashboard Campaigns panel mirrors the /creator/campaigns tabs
      // exactly by pulling from the same server actions, so "Open", "Invited",
      // "Pending", and "Active" show the identical, creator-relevant sets.
      const [eligibleOpen, invited, pending, active] = await Promise.all([
        getOpenCampaignsWithEligibility(50),
        getMyInvitations(),
        getPendingApplications(),
        getActiveCampaigns({ all: true }),
      ])

      // Open campaigns: only campaigns this creator is actually eligible for
      // (score-filtered + legal-age gated), ranked by match score.
      openCampaigns = eligibleOpen
        .filter((e) => e.eligible)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((e) => ({
          id: e.campaign.id,
          title: e.campaign.title,
          budget: e.campaign.budget,
          end_date: e.campaign.end_date,
          sponsor: { company_name: e.campaign.sponsor.company_name },
        }))

      invitedApplications = invited.map(toPanelApplication)
      pendingApplications = pending.map(toPanelApplication)
      activeApplications = active.map(toPanelApplication)
    } catch (error) {
      console.error('Creator dashboard DB query failed:', error)
      // Graceful fallback: still render dashboard with empty applications/stats.
      campaignApplications = []
      openCampaigns = []
      invitedApplications = []
      pendingApplications = []
      activeApplications = []
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
      invitedCampaigns={invitedApplications}
      pendingCampaigns={pendingApplications}
      activeCampaigns={activeApplications}
      creatorStats={{
        twitchFollowers: creatorStats?.subs_followers ?? null,
        averageVodViews: creatorStats?.average_vod_views ?? null,
        twitchUsername: creatorStats?.twitch_username ?? null,
        youtubeChannelName: creatorStats?.youtube_channel_name ?? null,
      }}
      statsUnavailable={statsUnavailable}
      isAdmin={role === 'admin'}
      calendarTasks={calendarTasks}
      missions={missions}
      checklist={{
        profileComplete: (creatorStats?.platform.length ?? 0) > 0,
        platformConnected: !!(creatorStats?.twitch_username || creatorStats?.youtube_channel_name),
        payoutConnected: !!creatorStats?.stripe_onboarding_complete,
        appliedToCampaign: campaignApplications.length > 0,
        // Mirrors the Deal Room listing gate (getMyDealRooms): accepted application
        // on a launched campaign. Only these deals actually appear in the Deal Room.
        dealRoomAvailable: campaignApplications.some(
          (a) => a.status === 'accepted' && a.campaign.status === 'launched',
        ),
        academyStarted: xpState.xp > 0,
      }}
    />
  );
}
