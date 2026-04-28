'use client'

import { useState } from 'react'
import RoleSidebar, {
  type SidebarNavGroup,
  type SidebarNavItem,
  type SidebarStatRow,
} from './RoleSidebar'

type Props = {
  children: React.ReactNode | ((collapsed: boolean) => React.ReactNode)
  homeHref: string
  navGroups: SidebarNavGroup[]
  collapsedNavItems?: SidebarNavItem[]
  statsTitle?: string
  statsRows?: SidebarStatRow[]
  statsUnavailable?: boolean
  animateContentOffset?: boolean
}

export default function RoleLayoutShell({
  children,
  homeHref,
  navGroups,
  collapsedNavItems,
  statsTitle,
  statsRows,
  statsUnavailable,
  animateContentOffset = true,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="relative z-10 flex min-h-screen">
      <RoleSidebar
        homeHref={homeHref}
        navGroups={navGroups}
        collapsedNavItems={collapsedNavItems}
        statsTitle={statsTitle}
        statsRows={statsRows}
        statsUnavailable={statsUnavailable}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      />
      <main
        className={`flex-1 flex flex-col min-w-0 ${
          animateContentOffset ? 'transition-[margin-left] duration-300 ease-in-out' : ''
        } ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}
      >
        {typeof children === 'function' ? children(collapsed) : children}
      </main>
    </div>
  )
}
