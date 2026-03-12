import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { BackLink } from '@/components/shared'

export default async function AdminProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="dash-panel">
          <h1 className="text-xl font-semibold dash-text-bright mb-2">Admin Profile</h1>
          <p className="text-sm dash-text-muted mb-6">
            Manage your admin profile.
          </p>
          <p className="text-sm dash-text-muted">
            Coming soon. For now, use the sidebar to access all current features.
          </p>
          <BackLink href="/admin" className="mt-4" />
        </div>
      </div>
    </div>
  )
}
