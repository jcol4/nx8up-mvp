import Link from 'next/link'
import AdminHeader from './AdminHeader'
import AdminActiveCampaigns from './AdminActiveCampaigns'
import AdminQuickInsights from './AdminQuickInsights'
import AdminVerificationQueue from './AdminVerificationQueue'
import AdminCreatorAcademy from './AdminCreatorAcademy'
import AdminEarningsCard from './AdminEarningsCard'

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminActiveCampaigns />
          <AdminQuickInsights />
          <AdminVerificationQueue />
          <AdminCreatorAcademy />
          <AdminEarningsCard />
        </div>
      </div>
    </div>
  )
}