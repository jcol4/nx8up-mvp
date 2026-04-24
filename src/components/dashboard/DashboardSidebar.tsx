/**
 * DashboardSidebar — collapsible sidebar used by sponsor and admin dashboards.
 * Collapses to icon-only (w-16) mode via a toggle button and click on the empty area.
 * statsNode slot is hidden in collapsed mode but always reserves vertical space when expanded.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLogo, NavItem } from '@/components/dashboard'

export type NavItemType = { href: string; label: string }

type Props = {
  /** Base route for the logo link and the Profile nav item (e.g. "/sponsor"). */
  logoHref: string
  /** Primary section nav links (Sections group). */
  sectionNavItems: NavItemType[]
  /** Label for the role-specific nav group heading. */
  sectionTitle: string
  /** Role-specific nav links shown below the section group. */
  navItems: NavItemType[]
  /** Optional stats block rendered at the top of the sidebar (e.g. XP bar). */
  statsNode?: React.ReactNode
  /** Explicit href for the Profile nav item. Defaults to `${logoHref}/profile` if omitted. */
  profileHref?: string
}

export default function DashboardSidebar({
  logoHref,
  sectionNavItems,
  sectionTitle,
  navItems,
  statsNode,
  profileHref,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative flex-shrink-0 border-r border-white/10 bg-black/20 flex flex-col transition-all duration-300 overflow-visible ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center p-2' : 'justify-between p-4'}`}>
        <DashboardLogo href={logoHref} className="flex-1 min-w-0" />
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded-lg dash-text-muted hover:dash-text-bright hover:bg-white/5 transition-colors shrink-0"
            aria-label="Collapse sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 rounded-r-lg bg-black/90 border border-l-0 border-white/20 flex items-center justify-center dash-text-muted hover:dash-accent transition-colors z-20"
            aria-label="Expand sidebar"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats block — fixed min-height so nav position never shifts between roles */}
      {!collapsed && (
        <div
          className="shrink-0 border-b border-white/10"
          style={{ minHeight: '180px' }}
        >
          {statsNode ?? null}
        </div>
      )}

      <nav className={`flex-1 flex flex-col min-h-0 px-2 py-4 ${collapsed ? 'items-center' : ''}`}>

        {/* Sections */}
        <div className={`space-y-1 overflow-y-auto overflow-x-hidden shrink-0 ${collapsed ? 'flex flex-col items-center gap-1' : ''}`}>
          {!collapsed && (
            <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-2 px-2">
              Sections
            </p>
          )}
          {sectionNavItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Role-specific nav — pushed down with mt-6 */}
        {!collapsed && navItems.length > 0 && (
          <div className="mt-6 shrink-0">
            <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-2 px-2">
              {sectionTitle}
            </p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        )}

        {/* Clickable empty area toggles sidebar */}
        <button
          type="button"
          className="flex-1 min-h-[60px] w-full cursor-default"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        />

        {/* Profile — pinned to bottom */}
        <div className={`shrink-0 border-t border-white/10 pt-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <NavItem
            href={profileHref ?? `${logoHref}/profile`}
            label="Profile"
            collapsed={collapsed}
          />
        </div>

      </nav>

      {collapsed && statsNode && (
        <div className="p-2 border-t border-white/10 shrink-0" aria-hidden="true" />
      )}
    </aside>
  )
}