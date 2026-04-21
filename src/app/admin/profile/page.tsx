/**
 * Admin Profile page (`/admin/profile`).
 *
 * Displays the profile of the currently authenticated admin user, combining
 * Clerk user data with live Prisma platform-wide statistics.
 *
 * Data fetched in parallel:
 *  - Clerk user record (avatar, name, email, metadata, timestamps)
 *  - `content_creators` count
 *  - `sponsors` count
 *  - `campaigns` grouped by status
 *  - `campaign_applications` grouped by status
 *
 * The page renders:
 *  1. Profile header with avatar, role badge, and primary email
 *  2. Account details (user ID, onboarding status, join date, last sign-in)
 *  3. Platform overview stat cards
 *  4. Campaigns and applications broken down by status
 *
 * External services: Clerk (`clerkClient`, `auth`), Prisma.
 *
 * Gotcha: `displayName` is derived from Clerk `publicMetadata.displayName`
 * first, then assembled from `firstName` + `lastName`. If all three are absent,
 * the heading renders an italic "No name set" placeholder.
 */
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Admin Profile — nx8up Admin' }

export default async function AdminProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const client = await clerkClient()

  const [user, creators, sponsors, campaigns, applications] = await Promise.all([
    client.users.getUser(userId),
    prisma.content_creators.count(),
    prisma.sponsors.count(),
    prisma.campaigns.groupBy({ by: ['status'], _count: true }),
    prisma.campaign_applications.groupBy({ by: ['status'], _count: true }),
  ])

  const meta = user.publicMetadata as { role?: string; onboardingComplete?: boolean; displayName?: string }
  const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
  const displayName = meta.displayName ?? (user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : null)

  const campaignCounts = Object.fromEntries(campaigns.map(c => [c.status, c._count]))
  const appCounts = Object.fromEntries(applications.map(a => [a.status, a._count]))

  const totalCampaigns = campaigns.reduce((s, c) => s + c._count, 0)
  const totalApplications = applications.reduce((s, a) => s + a._count, 0)

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="dash-panel p-6 flex items-start gap-5">
        {user.imageUrl && (
          <img
            src={user.imageUrl}
            alt={displayName ?? 'Admin'}
            className="w-16 h-16 rounded-full border border-white/10 shrink-0 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold dash-text-bright">
              {displayName ?? <span className="dash-text-muted italic">No name set</span>}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-yellow-500/10 text-yellow-400">
              admin
            </span>
          </div>
          <p className="text-sm dash-text-muted mt-0.5">{primaryEmail ?? '—'}</p>
          {user.username && (
            <p className="text-xs dash-text-muted mt-0.5">@{user.username}</p>
          )}
        </div>
      </div>

      {/* Account details */}
      <div className="dash-panel p-5 space-y-4">
        <h2 className="text-sm font-semibold dash-text-bright">Account</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="dash-text-muted mb-0.5">User ID</p>
            <p className="dash-text-bright font-mono text-xs truncate" title={user.id}>{user.id}</p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Onboarding</p>
            <span className={`text-xs px-2 py-0.5 rounded ${
              meta.onboardingComplete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {meta.onboardingComplete ? '✓ complete' : '⏳ pending'}
            </span>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Joined</p>
            <p className="dash-text-bright">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Last sign-in</p>
            <p className="dash-text-bright">
              {user.lastSignInAt
                ? new Date(user.lastSignInAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Platform stats */}
      <div>
        <h2 className="text-sm font-semibold dash-text-bright mb-3">Platform Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Creators',     value: creators,                       color: 'text-[#7b4fff]' },
            { label: 'Sponsors',     value: sponsors,                       color: 'text-[#00c8ff]' },
            { label: 'Total users',  value: creators + sponsors,            color: 'dash-text-bright' },
            { label: 'Campaigns',    value: totalCampaigns,                 color: 'dash-text-bright' },
          ].map(({ label, value, color }) => (
            <div key={label} className="dash-panel p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="text-xs dash-text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="dash-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold dash-text-bright">Campaigns by Status</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Live',      key: 'live',      color: 'text-[#22c55e]' },
              { label: 'Draft',     key: 'draft',     color: 'text-[#94a3b8]' },
              { label: 'Cancelled', key: 'cancelled', color: 'text-[#f87171]' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="dash-text-muted">{label}</span>
                <span className={`font-semibold ${color}`}>{(campaignCounts[key] ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="dash-text-muted">Total</span>
              <span className="dash-text-bright font-semibold">{totalCampaigns.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="dash-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold dash-text-bright">Applications by Status</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Accepted', key: 'accepted', color: 'text-[#22c55e]' },
              { label: 'Pending',  key: 'pending',  color: 'text-[#eab308]' },
              { label: 'Rejected', key: 'rejected', color: 'text-[#f87171]' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="dash-text-muted">{label}</span>
                <span className={`font-semibold ${color}`}>{(appCounts[key] ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="dash-text-muted">Total</span>
              <span className="dash-text-bright font-semibold">{totalApplications.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
