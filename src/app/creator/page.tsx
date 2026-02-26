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

export default async function CreatorDashboardPage() {
  const [displayInfo, xpState, calendarTasks, notifications, contentPlannerNotes] = await Promise.all([
    getUserDisplayInfo(),
    getCreatorXp(),
    getCreatorCalendarTasks(),
    getCreatorNotifications(),
    getContentPlannerNotes(),
  ]);
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

          {/* 3. Deals & Campaigns */}
          <DealsAndCampaignsSection />

          {/* 4. Academy */}
          <CreatorAcademySection />

          {/* 5. Content Planner */}
          <ContentPlannerSection initialNotes={contentPlannerNotes} />
        </div>
      </main>
    </>
  );
}
