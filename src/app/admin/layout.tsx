import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import { DashboardSidebar } from '@/components/dashboard'

export const metadata: Metadata = {
  title: 'Admin Hub | Nx8up',
  description: 'Admin dashboard',
}

const SECTION_NAV_ITEMS = [
  { href: '/creator', label: 'Creator' },
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/admin', label: 'Admin' },
]

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/creators', label: 'Creators' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/academy', label: 'Academy' },
]

async function getAdminUserStats() {
  const { userId } = await auth()
  if (!userId) return null
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.publicMetadata as Record<string, unknown> | null
  return {
    followers: (meta?.creatorFollowers as string) || '24.3K',
    subscribers: (meta?.creatorSubscribers as string) || '18.9K',
    nextPayout: (meta?.creatorNextPayout as string) || '$4,200',
    steamLinked: meta?.steamLinked === true,
  }
}

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role

  if (role !== 'admin') redirect('/')

  const stats = userId ? await getAdminUserStats() : null
  const s = stats ?? {
    followers: '24.3K',
    subscribers: '18.9K',
    nextPayout: '$4,200',
    steamLinked: true,
  }

  const statsNode = (
    <div className="px-4 pt-4 pb-4">
      <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-3">
        My Stats
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 dash-text-muted">
          <span>📺</span>
          <span>{s.followers} Followers</span>
        </div>
        <div className="flex items-center gap-2 dash-text-muted">
          <span>▶</span>
          <span>{s.subscribers} Subscribers</span>
        </div>
        <div className={`flex items-center gap-2 ${s.steamLinked ? 'dash-success' : 'dash-text-muted'}`}>
          <span>{s.steamLinked ? '✓' : '○'}</span>
          <span>Steam Profile {s.steamLinked ? 'Linked' : 'Not linked'}</span>
        </div>
        <div className="flex items-center gap-2 dash-text-muted">
          <span>Next Payout:</span>
          <span className="dash-text-bright font-semibold">{s.nextPayout}</span>
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
            logoHref="/admin"
            sectionNavItems={SECTION_NAV_ITEMS}
            sectionTitle="Admin"
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
