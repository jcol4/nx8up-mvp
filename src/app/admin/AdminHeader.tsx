import Link from 'next/link'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import UserProfileBlock from '@/components/shared/UserProfileBlock'

export default async function AdminHeader() {
  const { displayName, username } = await getUserDisplayInfo()
  const userName = displayName || username || 'Admin'

  return (
    <header className="dash-topbar flex-shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-sm dash-text-muted">
          Welcome, <span className="dash-text-bright font-semibold">{userName}!</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs dash-text-muted">
          <span>Active Missions: <span className="dash-accent font-semibold">3</span></span>
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
        <UserProfileBlock
          displayName={displayName}
          username={username}
          variant="admin"
        />
        <button
          type="button"
          className="p-2 rounded-lg dash-text-muted hover:dash-text-bright hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>
    </header>
  )
}
