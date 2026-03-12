import SponsorHeader from '../../SponsorHeader'
import { BackLink } from '@/components/shared'
import NewCampaignForm from './NewCampaignForm'

export default function NewCampaignPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold dash-text-bright mb-2">Post a campaign</h1>
          <p className="dash-text-muted text-sm mb-4">
            Create a campaign for creators to discover and apply to.
          </p>
          <BackLink href="/sponsor/campaigns" className="mb-6 inline-block" />

          <NewCampaignForm />
        </div>
      </div>
    </>
  )
}
