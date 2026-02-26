import Link from 'next/link'
import AdminHeader from '../AdminHeader'
import { DashboardPanel } from '@/components/dashboard'

export default function AdminReportsPage() {
  return (
    <>
      <AdminHeader />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <DashboardPanel title="Reports">
            <p className="dash-text-muted text-sm">Reports coming soon.</p>
            <Link href="/admin" className="text-sm dash-accent hover:underline mt-4 inline-block">
              ← Back to Dashboard
            </Link>
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
