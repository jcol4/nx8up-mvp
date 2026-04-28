/**
 * Admin section root layout (`/admin/**`).
 *
 * Responsibilities:
 *  1. **Auth guard** – reads Clerk `sessionClaims.metadata.role`; redirects to
 *     `/` if the caller is not an admin. This is the single enforcement point
 *     for the entire `/admin` subtree.
 *  2. **Stats prefetch** – fetches aggregate counts (total creators, sponsors,
 *     and active campaigns) from Prisma in a single `Promise.all` to populate
 *     the sidebar's "Platform Overview" widget.
 *  3. **Shell** – wraps all admin pages with `DashboardStyles`, `AdminSidebar`,
 *     and `AdminHeader`.
 *
 * External services: Clerk (auth), Prisma (DB).
 *
 * Gotcha: `SECTION_NAV_ITEMS` defined here differ from the duplicate constant
 * inside `AdminSidebar.tsx`. The layout passes its own array as a prop, so the
 * sidebar's local constant is silently overridden.
 */
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
  { href: '/admin/disputes', label: 'Disputes' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/academy', label: 'Academy' },
  { href: '/admin/surveys', label: 'Surveys' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/steam-lookup', label: 'Steam Lookup' },
  { href: '/admin/profile', label: 'Profile' },
  { href: '/admin/settings/notifications', label: 'Notifications' },
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