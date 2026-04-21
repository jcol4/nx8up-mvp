/**
 * NavItem — sidebar navigation link with active-state highlighting.
 * Root-level hrefs (e.g. /creator) use exact match; deeper hrefs use prefix match.
 * In collapsed mode shows only the first letter with a title tooltip.
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  href: string
  label: string
  icon?: React.ReactNode
  /** When true, renders icon/initial only and collapses text label. */
  collapsed?: boolean
}

export default function NavItem({ href, label, icon, collapsed }: Props) {
  const pathname = usePathname()
  const isRoot = /^\/[^/]+$/.test(href)
  const isActive = isRoot ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`dash-nav-item ${isActive ? 'dash-nav-item--active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
    >
      {icon && <span className="dash-nav-icon">{icon}</span>}
      {collapsed ? (
        <span className="text-sm font-semibold">{label.charAt(0)}</span>
      ) : (
        label
      )}
    </Link>
  )
}
