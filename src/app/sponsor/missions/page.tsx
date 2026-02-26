import SponsorHeader from '../SponsorHeader'
import Link from 'next/link'

export default function SponsorMissionsPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold dash-text-bright mb-4">My Missions</h1>
          <p className="dash-text-muted text-sm mb-6">
            Manage your posted missions and view applicants.
          </p>
          <Link
            href="/sponsor"
            className="text-sm dash-accent hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  )
}
