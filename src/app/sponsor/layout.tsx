import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import { DashboardSidebar } from '@/components/dashboard'

export const metadata: Metadata = {
  title: 'Sponsor Hub | Nx8up',
  description: 'Post campaigns and reach creators',
}

const ALL_SECTION_NAV_ITEMS = [
  { href: '/creator', label: 'Creator' },
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/admin', label: 'Admin' },
]

const SPONSOR_ONLY_SECTION_NAV_ITEMS = [
  { href: '/sponsor', label: 'Sponsor' },
]

const NAV_ITEMS = [
  { href: '/sponsor', label: 'Dashboard' },
  { href: '/sponsor/profile', label: 'Profile' },
  { href: '/sponsor/campaigns', label: 'My Campaigns' },
  { href: '/sponsor/creators', label: 'Creators' },
]

async function getSponsorStats() {
  const { userId } = await auth()
  if (!userId) return null
  return {
    activeCampaigns: 3,
    totalBudget: '$12,500',
    creatorsReached: 24,
  }
}

export default async function SponsorLayout({
  children,
}: { children: React.ReactNode }) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) redirect('/sign-in')
  if (role !== 'sponsor' && role !== 'admin') redirect('/')

  const stats = await getSponsorStats()
  const s = stats ?? { activeCampaigns: 3, totalBudget: '$12,500', creatorsReached: 24 }
  const sectionNavItems = role === 'admin' ? ALL_SECTION_NAV_ITEMS : SPONSOR_ONLY_SECTION_NAV_ITEMS

  const statsNode = (
    <div className="px-4 pt-4 pb-4">
      <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-3">
        Campaign Stats
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 dash-text-muted">
          <span>🎯</span>
          <span>{s.activeCampaigns} Active Campaigns</span>
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
  )

  return (
    <>
      <DashboardStyles />
      <div className="dash-root">
        <div className="relative z-10 flex min-h-screen">
          <DashboardSidebar
            logoHref="/sponsor"
            sectionNavItems={sectionNavItems}
            sectionTitle="Sponsor"
            navItems={NAV_ITEMS}
            statsNode={statsNode}
          />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
