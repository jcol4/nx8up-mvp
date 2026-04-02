import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import AdminSidebar from './AdminSidebar'
import { prisma } from '@/lib/prisma'
import AdminHeader from './AdminHeader'

export const metadata: Metadata = {
  title: 'Admin Hub | nx8up',
  description: 'Admin dashboard',
}

const SECTION_NAV_ITEMS = [
  { href: '/creator', label: 'Creator' },
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/admin', label: 'Admin' },
]

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/verification-queue', label: 'Verification Queue' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/academy', label: 'Academy' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/profile', label: 'Profile' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const [totalCreators, totalSponsors, activeCampaigns] = await Promise.all([
    prisma.content_creators.count(),
    prisma.sponsors.count(),
    prisma.campaigns.count({ where: { status: 'active' } }),
  ])

  const stats = {
    totalUsers: totalCreators + totalSponsors,
    totalCreators,
    totalSponsors,
    activeCampaigns,
  }

  return (
    <>
      <DashboardStyles />
      <div className="dash-root">
        <div className="relative z-10 flex min-h-screen">
          <AdminSidebar
            sectionNavItems={SECTION_NAV_ITEMS}
            navItems={NAV_ITEMS}
            stats={stats}
          />
        <main className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          {children}
        </main>
        </div>
      </div>
    </>
  )
}