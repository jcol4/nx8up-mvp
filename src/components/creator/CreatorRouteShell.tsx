'use client'

import RoleLayoutShell from '@/components/nx-shell/RoleLayoutShell'
import { type SidebarNavGroup, type SidebarNavItem, type SidebarStatRow } from '@/components/nx-shell/RoleSidebar'
import NxHudHeader from '@/components/nx-shell/NxHudHeader'

type Props = {
  children: React.ReactNode
  displayName?: string | null
  username?: string | null
  role?: string
  statsRows?: SidebarStatRow[]
  statsUnavailable?: boolean
}

export default function CreatorRouteShell({
  children,
  displayName = 'Creator',
  username = null,
  role,
  statsRows,
  statsUnavailable,
}: Props) {
  const isAdmin = role === 'admin'
  const collapsedNavItems: SidebarNavItem[] = [
    ...(isAdmin
      ? ([
          { href: '/admin', label: 'Admin', icon: 'verification' },
          { href: '/creator', label: 'Creator', icon: 'creators', exact: true },
          { href: '/sponsor', label: 'Sponsor', icon: 'payouts' },
        ] as SidebarNavItem[])
      : []),
    { href: '/creator', label: 'Dashboard', icon: 'dashboard', exact: true },
    { href: '/creator/profile', label: 'Profile', icon: 'profile' },
    { href: '/creator/campaigns', label: 'Campaigns', icon: 'campaigns' },
    { href: '/creator/deal-room', label: 'Deal Room', icon: 'dealRoom' },
    { href: '/creator/academy', label: 'Academy', icon: 'academy' },
    { href: '/creator/steam-lookup', label: 'Steam Lookup', icon: 'creators' },
    { href: '/creator/settings/notifications', label: 'Notifications', icon: 'notifications' },
  ]

  const navGroups: SidebarNavGroup[] = [
    ...(isAdmin
      ? [
          {
            title: 'Sections',
            items: [
              { href: '/admin', label: 'Admin', icon: 'verification' },
              { href: '/creator', label: 'Creator', icon: 'creators', exact: true },
              { href: '/sponsor', label: 'Sponsor', icon: 'payouts' },
            ] as SidebarNavItem[],
          } as SidebarNavGroup,
        ]
      : []),
    {
      title: 'Creator',
      items: [
        { href: '/creator', label: 'Dashboard', icon: 'dashboard', exact: true },
        { href: '/creator/profile', label: 'Profile', icon: 'profile' },
        { href: '/creator/campaigns', label: 'Campaigns', icon: 'campaigns' },
        { href: '/creator/deal-room', label: 'Deal Room', icon: 'dealRoom' },
        { href: '/creator/academy', label: 'Academy', icon: 'academy' },
        { href: '/creator/steam-lookup', label: 'Steam Lookup', icon: 'creators' },
      ] as SidebarNavItem[],
    },
    {
      title: 'Notifications',
      borderTop: true,
      items: [{ href: '/creator/settings/notifications', label: 'Preferences', icon: 'notifications' }] as SidebarNavItem[],
    },
  ]

  return (
    <RoleLayoutShell
      homeHref="/creator"
      navGroups={navGroups}
      collapsedNavItems={collapsedNavItems}
      statsTitle="My Stats"
      statsRows={statsRows}
      statsUnavailable={statsUnavailable}
      animateContentOffset={false}
    >
      {(collapsed) => (
        <>
          <NxHudHeader
            mode="fixedWithSidebar"
            collapsed={collapsed}
            displayName={displayName}
            username={username}
            role={role}
            profileHref="/creator/profile"
          />
          <div className="pt-20">{children}</div>
        </>
      )}
    </RoleLayoutShell>
  )
}
