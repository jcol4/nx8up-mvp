/**
 * Admin top-bar header component.
 *
 * Server component that:
 *  - Reads the current session via Clerk to obtain the user's role and display
 *    name (falls back to "Admin" if neither `displayName` nor `username` is set).
 *  - Renders a welcome greeting, a static summary strip (Active Campaigns,
 *    Pending Approvals, Earnings), a link back to `/admin`, the notification
 *    bell, and the `UserProfileBlock` set to the "admin" variant.
 *
 * Gotcha: the stats shown in the summary strip (Active Campaigns: 3,
 * Pending Approvals: 5, Earnings: $12,350) are **hardcoded mock values** and
 * do not reflect live database state.
 *
 * External services: Clerk (auth, `getUserDisplayInfo`).
 */
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import UserProfileBlock from '@/components/shared/UserProfileBlock'
import NotificationBell from '@/components/shared/NotificationBell'

export default async function AdminHeader() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { displayName, username } = await getUserDisplayInfo()
  const userName = displayName || username || 'Admin'

  return (
    <header className="dash-topbar flex-shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-sm dash-text-muted">
          Welcome, <span className="dash-text-bright font-semibold">{userName}!</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs dash-text-muted">
          <span>Active Campaigns: <span className="dash-accent font-semibold">3</span></span>
          <span>Pending Approvals: <span className="dash-purple font-semibold">5</span></span>
          <span>Earnings: <span className="dash-success font-semibold">$12,350</span></span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="text-xs font-semibold dash-accent hover:underline uppercase tracking-wider"
        >
          Admin Hub
        </Link>
        <NotificationBell />
        <UserProfileBlock
          displayName={displayName}
          username={username}
          variant="admin"
          role={role}
        />
      </div>
    </header>
  )
}
