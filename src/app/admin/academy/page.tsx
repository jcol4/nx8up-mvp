import { BackLink } from '@/components/shared'
import { DashboardPanel } from '@/components/dashboard'

export default function AdminAcademyPage() {
  return (
    <>
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <DashboardPanel title="Academy">
            <p className="dash-text-muted text-sm">Academy management coming soon.</p>
            <BackLink href="/admin" className="mt-4" />
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
