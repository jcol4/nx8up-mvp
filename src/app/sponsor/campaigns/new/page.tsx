import SponsorHeader from '../../SponsorHeader'
import NewCampaignForm from './NewCampaignForm'

export default function NewCampaignPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 sm:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold dash-text-bright">Post a Campaign</h1>
            <p className="dash-text-muted text-sm mt-1">
              Walk through the setup steps to create a campaign creators can apply to.
            </p>
          </div>
          <NewCampaignForm />
        </div>
      </div>
    </>
  )
}
