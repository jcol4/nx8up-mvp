import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import SponsorSidebar from './SponsorSidebar'

export const metadata: Metadata = {
  title: 'Sponsor Hub | Nx8up',
  description: 'Post missions and reach creators',
}

const NAV_ITEMS = [
  { href: '/sponsor', label: 'Dashboard' },
  { href: '/sponsor/missions', label: 'My Missions' },
  { href: '/sponsor/creators', label: 'Creators' },
]

async function getSponsorStats() {
  const { userId } = await auth()
  if (!userId) return null
  // TODO: Fetch from DB when available
  return {
    activeMissions: 3,
    totalBudget: '$12,500',
    creatorsReached: 24,
  }
}

export default async function SponsorLayout({
  children,
}: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const stats = userId ? await getSponsorStats() : null

  return (
    <>
      <DashboardStyles />
      <div className="dash-root">
        <div className="relative z-10 flex min-h-screen">
          <SponsorSidebar navItems={NAV_ITEMS} stats={stats} />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
