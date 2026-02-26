import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import AdminHeader from '../AdminHeader'
import { DashboardPanel, UserAvatar } from '@/components/dashboard'

async function getCreators() {
  const client = await clerkClient()
  const { data } = await client.users.getUserList({ limit: 20 })
  return data
    .filter((u) => (u.publicMetadata?.role as string) === 'creator')
    .map((u) => ({
      id: u.id,
      username: u.username ?? u.firstName ?? '—',
      imageUrl: u.imageUrl,
    }))
}

export default async function AdminCreatorsPage() {
  const { sessionClaims } = await auth()
  if ((sessionClaims?.metadata as { role?: string })?.role !== 'admin') redirect('/')

  const creators = await getCreators()

  return (
    <>
      <AdminHeader />
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <DashboardPanel title="Creators" href="/admin" linkLabel="Back to Dashboard">
            <div className="space-y-3">
              {creators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg dash-border border dash-bg-inner"
                >
                  <UserAvatar src={c.imageUrl} name={c.username} size="md" />
                  <span className="dash-text-bright font-medium">{c.username}</span>
                </div>
              ))}
              {creators.length === 0 && (
                <p className="dash-text-muted text-sm">No creators yet.</p>
              )}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
