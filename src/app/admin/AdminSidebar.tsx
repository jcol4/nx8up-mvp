/**
 * Admin sidebar component.
 *
 * Client component that wraps the shared `DashboardSidebar` and injects an
 * admin-specific "Platform Overview" stats panel showing platform-wide user and
 * campaign counts.
 *
 * The `stats` prop is populated by the parent layout (`/admin/layout.tsx`) via a
 * server-side Prisma query. If `stats` is null or omitted the component falls
 * back to all-zero values.
 *
 * Gotcha: this file also defines a `SECTION_NAV_ITEMS` constant but it is only
 * used when the parent does **not** pass a `sectionNavItems` prop. In practice
 * the layout always passes its own array, so this local constant is effectively
 * dead code and may diverge from the layout's definition over time.
 */
'use client'

import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

type NavItemType = { href: string; label: string }

type AdminStats = {
  totalUsers: number
  totalCreators: number
  totalSponsors: number
  activeCampaigns: number
}

type Props = {
  sectionNavItems?: NavItemType[]
  navItems: NavItemType[]
  stats?: AdminStats | null
}

const SECTION_NAV_ITEMS: NavItemType[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/academy', label: 'Academy' },
  { href: '/admin/profile', label: 'Profile' },

]

export default function AdminSidebar({ sectionNavItems, navItems, stats }: Props) {
  const s = stats ?? {
    totalUsers: 0,
    totalCreators: 0,
    totalSponsors: 0,
    activeCampaigns: 0,
  }

  const statsNode = (
    <div className="px-4 pt-3 pb-4">
      <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-3">
        Platform Overview
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Total users</span>
          <span className="dash-text-bright font-semibold">{s.totalUsers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Creators</span>
          <span className="text-[#7b4fff] font-semibold">{s.totalCreators.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Sponsors</span>
          <span className="text-[#00c8ff] font-semibold">{s.totalSponsors.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Active campaigns</span>
          <span className="dash-text-bright font-semibold">{s.activeCampaigns.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardSidebar
      logoHref="/admin"
      sectionNavItems={sectionNavItems ?? SECTION_NAV_ITEMS}
      sectionTitle="Admin"
      navItems={navItems}
      statsNode={statsNode}
    />
  )
}