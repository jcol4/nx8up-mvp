import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import { DashboardSidebar } from '@/components/dashboard'
import { prisma } from '@/lib/prisma'

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
  { href: '/sponsor/deal-room', label: 'Deal Room' },
  { href: '/sponsor/creators', label: 'Creators' },
]

async function getSponsorStats(userId: string) {
  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!sponsor) return null

  const [campaigns, acceptedApps] = await Promise.all([
    prisma.campaigns.findMany({
      where: { sponsor_id: sponsor.id, status: 'live' },
      select: { budget: true },
    }),
    prisma.campaign_applications.count({
      where: {
        status: 'accepted',
        campaign: { sponsor_id: sponsor.id },
      },
    }),
  ])

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget ?? 0), 0)

  return {
    activeCampaigns: campaigns.length,
    totalBudget: totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : '$0',
    creatorsReached: acceptedApps,
  }
}

export default async function SponsorLayout({
  children,
}: { children: React.ReactNode }) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) redirect('/sign-in')
  if (role !== 'sponsor' && role !== 'admin') redirect('/')

  const stats = await getSponsorStats(userId)
  const s = stats ?? { activeCampaigns: 0, totalBudget: '$0', creatorsReached: 0 }
  const sectionNavItems = role === 'admin' ? ALL_SECTION_NAV_ITEMS : SPONSOR_ONLY_SECTION_NAV_ITEMS

  const statsNode = (
    <div className="px-4 pt-4 pb-4">
      <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-3">
        Campaign Stats
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Live campaigns</span>
          <span className="font-bold" style={{ color: '#00c8ff', textShadow: '0 0 8px rgba(0,200,255,0.4)' }}>{s.activeCampaigns}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Live budget</span>
          <span className="font-bold" style={{ color: '#00e5a0', textShadow: '0 0 8px rgba(0,229,160,0.4)' }}>{s.totalBudget}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Creators accepted</span>
          <span className="font-bold" style={{ color: '#c084fc', textShadow: '0 0 8px rgba(192,132,252,0.4)' }}>{s.creatorsReached}</span>
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
