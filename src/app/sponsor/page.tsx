import SponsorHeader from './SponsorHeader'
import SponsorPostCampaignSection from './SponsorPostCampaignSection'
import SponsorMyCampaignsSection from './SponsorMyCampaignsSection'
import SponsorMatchedCreatorsSection from './SponsorMatchedCreatorsSection'

export default function SponsorDashboardPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Post Campaign - spans full width */}
            <div className="lg:col-span-2">
              <SponsorPostCampaignSection />
            </div>

            {/* My Campaigns + Matched Creators */}
            <SponsorMyCampaignsSection />
            <SponsorMatchedCreatorsSection />
          </div>
        </div>
      </div>
    </>
  )
}
