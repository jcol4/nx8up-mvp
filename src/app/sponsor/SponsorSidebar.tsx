'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLogo, NavItem } from '@/components/dashboard'

type NavItemType = { href: string; label: string }

type Stats = {
  activeMissions: number
  totalBudget: string
  creatorsReached: number
}

type Props = {
  navItems: NavItemType[]
  stats?: Stats | null
}

export default function SponsorSidebar({ navItems, stats }: Props) {
  const s = stats ?? {
    activeMissions: 3,
    totalBudget: '$12,500',
    creatorsReached: 24,
  }
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative flex-shrink-0 border-r border-white/10 bg-black/20 flex flex-col transition-all duration-300 overflow-visible ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center p-2' : 'justify-between p-4'}`}>
        {collapsed ? (
          <Link href="/sponsor" className="dash-logo text-xl">
            <span className="dash-logo-icon">
              <span /><span /><span />
            </span>
          </Link>
        ) : (
          <DashboardLogo href="/sponsor" className="flex-1 min-w-0" />
        )}
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

      {!collapsed && (
        <div className="px-4 pt-4 pb-4 border-b border-white/10 shrink-0">
          <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-3">
            Campaign Stats
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 dash-text-muted">
              <span>🎯</span>
              <span>{s.activeMissions} Active Missions</span>
            </div>
            <div className="flex items-center gap-2 dash-text-muted">
              <span>💰</span>
              <span>Budget: <span className="dash-text-bright font-semibold">{s.totalBudget}</span></span>
            </div>
            <div className="flex items-center gap-2 dash-text-muted">
              <span>👥</span>
              <span>{s.creatorsReached} Creators Reached</span>
            </div>
          </div>
        </div>
      )}

      <nav className={`flex-1 px-2 py-4 space-y-1 overflow-hidden ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {collapsed && (
        <div className="p-2 border-t border-white/10 flex flex-col items-center gap-2 text-xs dash-text-muted shrink-0">
          <span title={`${s.activeMissions} Active Missions`}>🎯</span>
          <span title={`Budget: ${s.totalBudget}`} className="dash-text-bright font-semibold">{s.totalBudget}</span>
          <span title={`${s.creatorsReached} Creators Reached`}>👥</span>
        </div>
      )}
    </aside>
  )
}
