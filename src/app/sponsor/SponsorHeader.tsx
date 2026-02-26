import Link from 'next/link'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import UserProfileBlock from '@/components/shared/UserProfileBlock'

export default async function SponsorHeader() {
  const { displayName, username } = await getUserDisplayInfo()
  const userName = displayName || username || 'Sponsor'

  return (
    <header className="dash-topbar flex-shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-sm dash-text-muted">
          Welcome, <span className="dash-text-bright font-semibold">{userName}!</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs dash-text-muted">
          <span>Active Missions: <span className="dash-accent font-semibold">3</span></span>
          <span>Creators Reached: <span className="dash-purple font-semibold">24</span></span>
          <span>Budget: <span className="dash-success font-semibold">$12,500</span></span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/sponsor"
          className="text-xs font-semibold dash-accent hover:underline uppercase tracking-wider"
        >
          Sponsor Hub
        </Link>
        <UserProfileBlock
          displayName={displayName}
          username={username}
          variant="admin"
        />
      </div>
    </header>
  )
}
