'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('nav')
  const isAdmin = role === 'admin'
  const roleSwitchItems: SidebarNavItem[] = [
    { href: '/admin', label: t('roleAdmin'), icon: 'verification' },
    { href: '/creator', label: t('roleCreator'), icon: 'creators', exact: true },
    { href: '/sponsor', label: t('roleSponsor'), icon: 'payouts' },
  ]
  const collapsedNavItems: SidebarNavItem[] = [
    ...(isAdmin ? roleSwitchItems : []),
    { href: '/creator', label: t('dashboard'), icon: 'dashboard', exact: true },
    { href: '/creator/profile', label: t('profile'), icon: 'profile' },
    { href: '/creator/campaigns', label: t('campaigns'), icon: 'campaigns' },
    { href: '/creator/deal-room', label: t('dealRoom'), icon: 'dealRoom' },
    { href: '/creator/academy', label: t('academy'), icon: 'academy' },
    { href: '/creator/steam-lookup', label: t('steamLookup'), icon: 'creators' },
    { href: '/creator/settings/notifications', label: t('notifications'), icon: 'notifications' },
  ]

  const navGroups: SidebarNavGroup[] = [
    ...(isAdmin
      ? [
          {
            title: t('sections'),
            items: roleSwitchItems,
          } as SidebarNavGroup,
        ]
      : []),
    {
      title: t('roleCreator'),
      items: [
        { href: '/creator', label: t('dashboard'), icon: 'dashboard', exact: true },
        { href: '/creator/profile', label: t('profile'), icon: 'profile' },
        { href: '/creator/campaigns', label: t('campaigns'), icon: 'campaigns' },
        { href: '/creator/deal-room', label: t('dealRoom'), icon: 'dealRoom' },
        { href: '/creator/academy', label: t('academy'), icon: 'academy' },
        { href: '/creator/guide', label: t('guide'), icon: 'reports' },
        { href: '/creator/steam-lookup', label: t('steamLookup'), icon: 'creators' },
      ] as SidebarNavItem[],
    },
    {
      title: t('notifications'),
      borderTop: true,
      items: [{ href: '/creator/settings/notifications', label: t('preferences'), icon: 'notifications' }] as SidebarNavItem[],
    },
  ]

  return (
    <RoleLayoutShell
      homeHref="/creator"
      navGroups={navGroups}
      collapsedNavItems={collapsedNavItems}
      statsRows={statsRows}
      statsUnavailable={statsUnavailable}
      statsTitle={t('myStats')}
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
