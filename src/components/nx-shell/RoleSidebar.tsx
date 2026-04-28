'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import {
  Bell,
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'

export type SidebarIconName =
  | 'dashboard'
  | 'profile'
  | 'campaigns'
  | 'dealRoom'
  | 'academy'
  | 'notifications'
  | 'settings'
  | 'creators'
  | 'users'
  | 'verification'
  | 'applications'
  | 'reports'
  | 'payouts'

export type SidebarNavItem = {
  href: string
  label: string
  icon?: SidebarIconName
  exact?: boolean
}

export type SidebarNavGroup = {
  title: string
  items: SidebarNavItem[]
  borderTop?: boolean
}

export type SidebarStatRow = {
  label: string
  value: string
  valueClassName?: string
}

type Props = {
  homeHref: string
  navGroups: SidebarNavGroup[]
  collapsedNavItems?: SidebarNavItem[]
  statsTitle?: string
  statsRows?: SidebarStatRow[]
  statsUnavailable?: boolean
  collapsed: boolean
  onToggleCollapsed: () => void
}

const ICONS: Record<SidebarIconName, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  profile: User,
  campaigns: Megaphone,
  dealRoom: Handshake,
  academy: GraduationCap,
  notifications: Bell,
  settings: Settings,
  creators: Users,
  users: Users,
  verification: ShieldCheck,
  applications: FileText,
  reports: BookOpen,
  payouts: Briefcase,
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarItem({
  item,
  collapsed,
}: {
  item: SidebarNavItem
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const Icon = item.icon ? ICONS[item.icon] : null
  const active = isActive(pathname, item.href, item.exact)
  const prefetch = item.href === '/admin/users'
    || item.href === '/admin/applications'
    || item.href === '/sponsor/campaigns'
    || item.href === '/sponsor/deal-room'

  return (
    <Link
      href={item.href}
      prefetch={prefetch}
      title={collapsed ? item.label : undefined}
      className={`flex w-full items-center rounded-xl text-left text-[9px] uppercase tracking-[0.14em] transition duration-200 ${
        collapsed ? 'justify-center px-2 py-3' : 'gap-2 px-4 py-2'
      } ${
        active
          ? 'bg-[#99f7ff]/10 text-[#99f7ff] shadow-[inset_3px_0_0_rgba(153,247,255,0.85)]'
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </Link>
  )
}

export default function RoleSidebar({
  homeHref,
  navGroups,
  collapsedNavItems,
  statsTitle = 'My Stats',
  statsRows = [],
  statsUnavailable = false,
  collapsed,
  onToggleCollapsed,
}: Props) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col overflow-hidden border-r border-white/5 bg-slate-950/80 pt-10 transition-[width] duration-300 ease-in-out md:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="mb-3 flex shrink-0 items-center px-3">
        <Link
          href={homeHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#99f7ff]/35 bg-[#99f7ff]/10 shadow-[0_0_16px_-4px_rgba(153,247,255,0.55)]"
          aria-label="Dashboard home"
        >
          <Image
            src="/nx8up_logo_transparent.png"
            alt="Nx8up logo"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
        </Link>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`${collapsed ? 'ml-2' : 'ml-auto'} h-9 w-9 rounded-md border border-[#99f7ff]/35 bg-[#99f7ff]/10 text-[#99f7ff] shadow-[0_0_16px_-4px_rgba(153,247,255,0.55)] hover:bg-[#99f7ff]/15`}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="mx-auto h-4 w-4" /> : <PanelLeftClose className="mx-auto h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain pb-2">
        {collapsed && collapsedNavItems && collapsedNavItems.length > 0 && (
          <div className="px-2 pb-2">
            <div className="mt-2 space-y-1">
              {collapsedNavItems.map((item) => (
                <SidebarItem key={item.href} item={item} collapsed />
              ))}
            </div>
          </div>
        )}

        <div
          className={`px-4 pb-2 transition-all duration-300 ${
            collapsed ? 'max-h-0 -translate-x-2 overflow-hidden opacity-0 pointer-events-none' : 'max-h-none translate-x-0 opacity-100'
          }`}
        >
          {statsRows.length > 0 && (
            <div className="mt-2 border-b border-white/8 pb-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-headline text-[10px] uppercase tracking-[0.16em] text-slate-400">{statsTitle}</p>
                {statsUnavailable ? (
                  <span className="text-[9px] uppercase tracking-[0.14em] text-amber-400/90">Stats unavailable</span>
                ) : null}
              </div>
              <div className="space-y-2.5 text-[10px]">
                {statsRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-slate-400">
                    <span className="text-[10px] text-slate-400">{row.label}</span>
                    <span className={`text-[10px] ${row.valueClassName ?? 'text-slate-300'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {navGroups.map((group) => (
            <div key={group.title} className={`${group.borderTop ? 'border-t border-white/8' : ''} py-4`}>
              <p className="mb-2 font-headline text-[9px] uppercase tracking-[0.16em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarItem key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 px-4 pb-4">
        <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                collapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-20 translate-x-0 opacity-100'
              }`}
            >
              Sign Out
            </span>
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
}
