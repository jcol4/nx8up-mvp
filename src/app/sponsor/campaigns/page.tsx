import { BackLink } from '@/components/shared'
import SponsorHeader from '../SponsorHeader'

export default function SponsorCampaignsPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold dash-text-bright mb-4">My Campaigns</h1>
          <p className="dash-text-muted text-sm mb-6">
            Manage your posted campaigns and view applicants.
          </p>
          <BackLink href="/sponsor" />
        </div>
      </div>
    </>
  )
}
