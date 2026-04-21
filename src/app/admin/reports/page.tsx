/**
 * Admin Reports page (`/admin/reports`).
 *
 * Placeholder page for future reporting/analytics functionality.
 * Currently renders a "coming soon" message inside a `DashboardPanel`.
 * Access is already gated by the parent admin layout.
 */
import { BackLink } from '@/components/shared'
import AdminHeader from '../AdminHeader'
import { DashboardPanel } from '@/components/dashboard'

export default function AdminReportsPage() {
  return (
    <>
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <DashboardPanel title="Reports">
            <p className="dash-text-muted text-sm">Reports coming soon.</p>
            <BackLink href="/admin" className="mt-4" />
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
