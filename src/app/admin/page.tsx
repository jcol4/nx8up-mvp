/**
 * Admin Dashboard page (`/admin`).
 *
 * Renders the top-level overview for administrators, composing five dashboard
 * widget components in a two-column responsive grid:
 *   - AdminActiveCampaigns  – live campaign cards (static mock data)
 *   - AdminQuickInsights    – key platform metrics (static mock data)
 *   - AdminVerificationQueue – live Prisma query for pending deal submissions
 *   - AdminCreatorAcademy   – featured lesson cards (static mock data)
 *   - AdminEarningsCard     – monthly earnings summary (static mock data)
 *
 * Access is gated at the layout level (`/admin/layout.tsx`); this page itself
 * performs no additional auth checks.
 *
 * @module AdminDashboardPage
 */
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