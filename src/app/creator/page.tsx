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
import { getCreatorXp, getCreatorCalendarTasks } from "./_actions";
import { getUserDisplayInfo } from "@/lib/get-user-display-info";
import CreatorTopBar from "@/components/creator/CreatorTopBar";
import UserProfileBlock from "@/components/shared/UserProfileBlock";
import CreatorProgressPanel from "./CreatorProgressPanel";
import CreatorMissionsSection from "./CreatorMissionsSection";
import CreatorAcademySection from "./CreatorAcademySection";
import NotificationBell from "@/components/shared/NotificationBell";
import DealsAndCampaignsSection from "./DealsAndCampaignsSection";
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
  const role = (authResult.sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // Fetch creator's campaign applications for the Campaigns panel
  const { userId } = authResult
  const campaignApplications = userId
    ? await prisma.campaign_applications.findMany({
        where: { creator: { clerk_user_id: userId } },
        select: {
          id: true,
          status: true,
          submitted_at: true,
          campaign: {
            select: {
              id: true,
              title: true,
              budget: true,
              end_date: true,
              sponsor: { select: { company_name: true } },
            },
          },
        },
        orderBy: { submitted_at: 'desc' },
        take: 20,
      })
    : []
  const { displayName, username } = displayInfo;
  return (
    <>
      <CreatorTopBar
        rightContent={
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell />
            <UserProfileBlock
              displayName={displayName}
              username={username}
              variant="creator"
              editProfileLink="/creator/profile"
              role={role}
            />
          </div>
        }
      />

      {/* Main content: 2x3 grid (5 panels, Pocketmate removed) */}
      <main className="max-w-7xl mx-auto p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Today's Missions */}
          <CreatorMissionsSection />

          {/* 2. Central progress & calendar */}
          <CreatorProgressPanel xpState={xpState} calendarTasks={calendarTasks} />

          {/* 3. Campaigns */}
          <DealsAndCampaignsSection applications={campaignApplications} />

          {/* 4. Academy */}
          <CreatorAcademySection />


        </div>
      </main>
    </>
  );
}
