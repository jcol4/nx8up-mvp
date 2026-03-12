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
  { href: '/admin/creators', label: 'Creators' },
  { href: '/admin/sponsors', label: 'Sponsors' },
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