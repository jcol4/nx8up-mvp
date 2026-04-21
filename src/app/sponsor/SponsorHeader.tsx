/**
 * SponsorHeader — top bar rendered on every page inside the sponsor dashboard.
 *
 * Fetches the signed-in user's display name via `getUserDisplayInfo` (Clerk) and
 * renders a welcome greeting alongside quick-stats, a hub link, the notification
 * bell, and a user profile block.
 *
 * Gotcha: The quick-stat numbers shown in the header (Active Campaigns: 3,
 * Creators Reached: 24, Budget: $12,500) are HARDCODED placeholders and do NOT
 * reflect real data. See bug report. These should be replaced with live data from
 * the database.
 *
 * External services: Clerk (auth + user display info).
 */
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import UserProfileBlock from '@/components/shared/UserProfileBlock'
import NotificationBell from '@/components/shared/NotificationBell'

export default async function SponsorHeader() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { displayName, username } = await getUserDisplayInfo()
  const userName = displayName || username || 'Sponsor'

  return (
    <header className="dash-topbar flex-shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-sm dash-text-muted">
          Welcome, <span className="dash-text-bright font-semibold">{userName}!</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs dash-text-muted">
          <span>Active Campaigns: <span className="dash-accent font-semibold">3</span></span>
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
        <NotificationBell />
        <UserProfileBlock
          displayName={displayName}
          username={username}
          variant="admin"
          editProfileLink="/sponsor/profile"
          role={role}
        />
      </div>
    </header>
  )
}
