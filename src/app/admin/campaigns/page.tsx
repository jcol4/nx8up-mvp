import { BackLink } from '@/components/shared'
import { DashboardPanel } from '@/components/dashboard'
import AdminHeader from '../AdminHeader'

export default function AdminCampaignsPage() {
  return (
    <>
      <AdminHeader />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <DashboardPanel title="Campaigns">
            <p className="dash-text-muted text-sm">Campaign management coming soon.</p>
            <BackLink href="/admin" className="mt-4" />
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
