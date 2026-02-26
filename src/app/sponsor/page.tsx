import SponsorHeader from './SponsorHeader'
import SponsorPostMissionSection from './SponsorPostMissionSection'
import SponsorMyMissionsSection from './SponsorMyMissionsSection'
import SponsorMatchedCreatorsSection from './SponsorMatchedCreatorsSection'

export default function SponsorDashboardPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Post Mission - spans full width */}
            <div className="lg:col-span-2">
              <SponsorPostMissionSection />
            </div>

            {/* My Missions + Matched Creators */}
            <SponsorMyMissionsSection />
            <SponsorMatchedCreatorsSection />
          </div>
        </div>
      </div>
    </>
  )
}
