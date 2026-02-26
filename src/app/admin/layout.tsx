import type { Metadata } from 'next'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import AdminSidebar from './AdminSidebar'

export const metadata: Metadata = {
  title: 'Admin Hub | Nx8up',
  description: 'Admin dashboard',
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/missions', label: 'Missions' },
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

  return (
    <>
      <DashboardStyles />
      <div className="dash-root">
        <div className="relative z-10 flex min-h-screen">
          <AdminSidebar navItems={NAV_ITEMS} stats={stats} />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
