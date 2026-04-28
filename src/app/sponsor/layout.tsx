import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Inter, Space_Grotesk } from 'next/font/google'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import RoleLayoutShell from '@/components/nx-shell/RoleLayoutShell'
import NxHudBackground from '@/components/nx-shell/NxHudBackground'
import type { SidebarNavGroup, SidebarNavItem } from '@/components/nx-shell/RoleSidebar'

export const metadata: Metadata = {
  title: 'Sponsor Hub | Nx8up',
  description: 'Post campaigns and reach creators',
}

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-headline',
  subsets: ['latin'],
})

export default async function SponsorLayout({
  children,
}: { children: React.ReactNode }) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) redirect('/sign-in')
  if (role !== 'sponsor' && role !== 'admin') redirect('/')
  const adminSectionGroup: SidebarNavGroup[] =
    role === 'admin'
      ? [
        {
          title: 'Sections',
          items: [
            { href: '/admin', label: 'Admin', icon: 'verification' },
            { href: '/creator', label: 'Creator', icon: 'creators' },
            { href: '/sponsor', label: 'Sponsor', icon: 'payouts', exact: true },
          ] as SidebarNavItem[],
        },
      ]
      : []
  const navGroups: SidebarNavGroup[] = [
    ...adminSectionGroup,
    {
      title: 'Sponsor',
      items: [
        { href: '/sponsor', label: 'Dashboard', icon: 'dashboard', exact: true },
        { href: '/sponsor/profile', label: 'Profile', icon: 'profile' },
        { href: '/sponsor/campaigns', label: 'My Campaigns', icon: 'campaigns' },
        { href: '/sponsor/deal-room', label: 'Deal Room', icon: 'dealRoom' },
        { href: '/sponsor/creators', label: 'Creators', icon: 'creators' },
        { href: '/sponsor/payouts', label: 'Payouts', icon: 'payouts' },
      ] as SidebarNavItem[],
    },
    {
      title: 'Notifications',
      borderTop: true,
      items: [
        { href: '/sponsor/settings/notifications', label: 'Preferences', icon: 'notifications' },
      ] as SidebarNavItem[],
    },
  ]
  const adminCollapsedItems: SidebarNavItem[] =
    role === 'admin'
      ? [
        { href: '/admin', label: 'Admin', icon: 'verification' },
        { href: '/creator', label: 'Creator', icon: 'creators' },
        { href: '/sponsor', label: 'Sponsor', icon: 'payouts', exact: true },
      ] as SidebarNavItem[]
      : []
  const collapsedNavItems: SidebarNavItem[] = [
    ...adminCollapsedItems,
    { href: '/sponsor', label: 'Dashboard', icon: 'dashboard', exact: true },
    { href: '/sponsor/profile', label: 'Profile', icon: 'profile' },
    { href: '/sponsor/campaigns', label: 'Campaigns', icon: 'campaigns' },
    { href: '/sponsor/deal-room', label: 'Deals', icon: 'dealRoom' },
    { href: '/sponsor/creators', label: 'Creators', icon: 'creators' },
    { href: '/sponsor/settings/notifications', label: 'Alerts', icon: 'notifications' },
  ]
  const statsRows = [
    { label: 'Live campaigns', value: '—', valueClassName: 'font-bold text-[#00c8ff]' },
    { label: 'Live budget', value: '—', valueClassName: 'font-bold text-[#00e5a0]' },
    { label: 'Creators accepted', value: '—', valueClassName: 'font-bold text-[#c084fc]' },
  ]

  return (
    <>
      <DashboardStyles />
      <div className={`creator-hud dash-root relative isolate ${inter.variable} ${spaceGrotesk.variable}`}>
        <NxHudBackground />
        <RoleLayoutShell
          homeHref="/sponsor"
          navGroups={navGroups}
          collapsedNavItems={collapsedNavItems}
          statsTitle="Campaign Stats"
          statsRows={statsRows}
          animateContentOffset={false}
        >
          {children}
        </RoleLayoutShell>
      </div>
    </>
  )
}
