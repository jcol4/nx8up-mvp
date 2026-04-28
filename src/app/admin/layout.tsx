import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Inter, Space_Grotesk } from 'next/font/google'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import AdminHeader from './_components/AdminHeader'
import RoleLayoutShell from '@/components/nx-shell/RoleLayoutShell'
import NxHudBackground from '@/components/nx-shell/NxHudBackground'
import type { SidebarNavGroup, SidebarNavItem } from '@/components/nx-shell/RoleSidebar'

export const metadata: Metadata = {
  title: 'Admin Hub | nx8up',
  description: 'Admin dashboard',
}

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-headline',
  subsets: ['latin'],
})

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')
  const navGroups: SidebarNavGroup[] = [
    {
      title: 'Sections',
      items: [
        { href: '/admin', label: 'Admin', icon: 'verification' },
        { href: '/creator', label: 'Creator', icon: 'creators' },
        { href: '/sponsor', label: 'Sponsor', icon: 'payouts' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
        { href: '/admin/users', label: 'Users', icon: 'users' },
        { href: '/admin/campaigns', label: 'Campaigns', icon: 'campaigns' },
        { href: '/admin/verification-queue', label: 'Verification Queue', icon: 'verification' },
        { href: '/admin/disputes', label: 'Disputes', icon: 'reports' },
        { href: '/admin/applications', label: 'Applications', icon: 'applications' },
        { href: '/admin/reports', label: 'Reports', icon: 'reports' },
        { href: '/admin/academy', label: 'Academy', icon: 'academy' },
        { href: '/admin/surveys', label: 'Surveys', icon: 'academy' },
        { href: '/admin/steam-lookup', label: 'Steam Lookup', icon: 'creators' },
        { href: '/admin/profile', label: 'Profile', icon: 'profile' },
      ],
    },
    {
      title: 'Notifications',
      borderTop: true,
      items: [
        { href: '/admin/settings/notifications', label: 'Preferences', icon: 'notifications' },
      ],
    },
  ]
  const collapsedNavItems: SidebarNavItem[] = [
    { href: '/admin', label: 'Admin', icon: 'verification' },
    { href: '/creator', label: 'Creator', icon: 'creators' },
    { href: '/sponsor', label: 'Sponsor', icon: 'payouts' },
    { href: '/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
    { href: '/admin/users', label: 'Users', icon: 'users' },
    { href: '/admin/campaigns', label: 'Campaigns', icon: 'campaigns' },
    { href: '/admin/verification-queue', label: 'Verification', icon: 'verification' },
    { href: '/admin/disputes', label: 'Disputes', icon: 'reports' },
    { href: '/admin/reports', label: 'Reports', icon: 'reports' },
    { href: '/admin/surveys', label: 'Surveys', icon: 'academy' },
    { href: '/admin/settings/notifications', label: 'Alerts', icon: 'notifications' },
  ]
  const statsRows = [
    { label: 'Total users', value: '—' },
    { label: 'Creators', value: '—', valueClassName: 'font-semibold text-[#7b4fff]' },
    { label: 'Sponsors', value: '—', valueClassName: 'font-semibold text-[#00c8ff]' },
    { label: 'Active campaigns', value: '—' },
  ]

  return (
    <>
      <DashboardStyles />
      <div className={`creator-hud dash-root relative isolate ${inter.variable} ${spaceGrotesk.variable}`}>
        <NxHudBackground />
        <RoleLayoutShell
          homeHref="/admin"
          navGroups={navGroups}
          collapsedNavItems={collapsedNavItems}
          statsTitle="Platform Overview"
          statsRows={statsRows}
          animateContentOffset={false}
        >
          <AdminHeader />
          <div className="pt-4">
            {children}
          </div>
        </RoleLayoutShell>
      </div>
    </>
  )
}