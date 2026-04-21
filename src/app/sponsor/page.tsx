/**
 * Sponsor dashboard page — the root route for /sponsor.
 *
 * Renders the main sponsor overview, composed of three dashboard sections:
 * - SponsorPostCampaignSection: CTA to create a new campaign.
 * - SponsorMyCampaignsSection: Live snippet of the sponsor's recent campaigns (fetched server-side).
 * - SponsorMatchedCreatorsSection: Creators that match the sponsor's targeting criteria.
 *
 * Auth and role guarding is handled by the parent layout (SponsorLayout).
 * This page itself performs no auth checks.
 */
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
