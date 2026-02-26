import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'
import AdminHeader from '../AdminHeader'

export default function AdminMissionsPage() {
  return (
    <>
      <AdminHeader />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <DashboardPanel title="Missions">
            <p className="dash-text-muted text-sm">Mission management coming soon.</p>
            <Link href="/admin" className="text-sm dash-accent hover:underline mt-4 inline-block">
              ← Back to Dashboard
            </Link>
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
