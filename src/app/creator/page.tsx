import { auth } from "@clerk/nextjs/server";
import { getCreatorXp, getCreatorCalendarTasks, getCreatorNotifications } from "./_actions";
import { getUserDisplayInfo } from "@/lib/get-user-display-info";
import CreatorTopBar from "@/components/creator/CreatorTopBar";
import UserProfileBlock from "@/components/shared/UserProfileBlock";
import CreatorProgressPanel from "./CreatorProgressPanel";
import CreatorMissionsSection from "./CreatorMissionsSection";
import CreatorAcademySection from "./CreatorAcademySection";
import CreatorNotifications from "./CreatorNotifications";
import DealsAndCampaignsSection from "./DealsAndCampaignsSection";
import ContentPlannerSection from "./ContentPlannerSection";
import { getContentPlannerNotes } from "./_actions";
import { prisma } from "@/lib/prisma";

export default async function CreatorDashboardPage() {
  const [authResult, displayInfo, xpState, calendarTasks, notifications, contentPlannerNotes] =
    await Promise.all([
      auth(),
      getUserDisplayInfo(),
      getCreatorXp(),
      getCreatorCalendarTasks(),
      getCreatorNotifications(),
      getContentPlannerNotes(),
    ]);
  const role = (authResult.sessionClaims?.metadata as { role?: string } | undefined)?.role;

  // Fetch creator's campaign applications for the Campaigns panel
  const { userId } = authResult
  const campaignApplications = userId
    ? await prisma.campaign_applications.findMany({
        where: { creator: { clerk_user_id: userId } },
        include: {
          campaign: {
            include: { sponsor: { select: { company_name: true } } },
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
            <CreatorNotifications notifications={notifications} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* 1. Today's Missions */}
          <CreatorMissionsSection />

          {/* 2. Central progress & calendar */}
          <CreatorProgressPanel xpState={xpState} calendarTasks={calendarTasks} />

          {/* 3. Campaigns */}
          <DealsAndCampaignsSection applications={campaignApplications} />

          {/* 4. Academy */}
          <CreatorAcademySection />

          {/* 5. Content Planner */}
          <ContentPlannerSection initialNotes={contentPlannerNotes} />
        </div>
      </main>
    </>
  );
}
