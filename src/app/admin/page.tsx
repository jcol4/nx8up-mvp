import Link from 'next/link'
import AdminHeader from './AdminHeader'
import AdminActiveMissions from './AdminActiveMissions'
import AdminQuickInsights from './AdminQuickInsights'
import AdminVerificationQueue from './AdminVerificationQueue'
import AdminCreatorAcademy from './AdminCreatorAcademy'
import AdminEarningsCard from './AdminEarningsCard'

export default function AdminDashboardPage() {
  return (
    <>
      <AdminHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Grid: 2 columns on lg, 1 on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Row 1: Active Missions + Quick Insights */}
            <AdminActiveMissions />
            <AdminQuickInsights />

            {/* Row 2: Verification Queue */}
            <AdminVerificationQueue />

            {/* Row 3: Creator Academy + Earnings */}
            <AdminCreatorAcademy />
            <AdminEarningsCard />
          </div>
        </div>
      </div>
    </>
  )
}
