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
  const themedCardClass =
    'glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20'

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Admin Profile</h1>
          <p className="mt-1 text-sm text-[#c4cad6]">Your account and platform overview.</p>
        </div>

      {/* Header */}
      <div className={`${themedCardClass} p-6 flex items-start gap-5`}>
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
          <p className="mt-0.5 text-sm text-[#d6deea]">{primaryEmail ?? '—'}</p>
          {user.username && (
            <p className="mt-0.5 text-xs text-[#b9c5d8]">@{user.username}</p>
          )}
        </div>
      </div>

      {/* Account details */}
      <div className={`${themedCardClass} p-5 space-y-4`}>
        <h2 className="text-sm font-semibold text-[#eaf6ff]">Account</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="mb-0.5 text-[#b9c5d8]">User ID</p>
            <p className="truncate font-mono text-xs text-[#e8f4ff]" title={user.id}>{user.id}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[#b9c5d8]">Onboarding</p>
            <span className={`text-xs px-2 py-0.5 rounded ${
              meta.onboardingComplete ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {meta.onboardingComplete ? '✓ complete' : '⏳ pending'}
            </span>
          </div>
          <div>
            <p className="mb-0.5 text-[#b9c5d8]">Joined</p>
            <p className="text-[#e8f4ff]">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-[#b9c5d8]">Last sign-in</p>
            <p className="text-[#e8f4ff]">
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
        <h2 className="mb-3 text-sm font-semibold text-[#eaf6ff]">Platform Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Creators',     value: creators,                       color: 'text-[#7b4fff]' },
            { label: 'Sponsors',     value: sponsors,                       color: 'text-[#00c8ff]' },
            { label: 'Total users',  value: creators + sponsors,            color: 'text-[#e8f4ff]' },
            { label: 'Campaigns',    value: totalCampaigns,                 color: 'text-[#e8f4ff]' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`${themedCardClass} p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="mt-1 text-xs text-[#c4cad6]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${themedCardClass} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-[#eaf6ff]">Campaigns by Status</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Live',      key: 'live',      color: 'text-[#22c55e]' },
              { label: 'Draft',     key: 'draft',     color: 'text-[#94a3b8]' },
              { label: 'Cancelled', key: 'cancelled', color: 'text-[#f87171]' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[#c4cad6]">{label}</span>
                <span className={`font-semibold ${color}`}>{(campaignCounts[key] ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[#c4cad6]">Total</span>
              <span className="font-semibold text-[#e8f4ff]">{totalCampaigns.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className={`${themedCardClass} p-5 space-y-3`}>
          <h2 className="text-sm font-semibold text-[#eaf6ff]">Applications by Status</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Accepted', key: 'accepted', color: 'text-[#22c55e]' },
              { label: 'Pending',  key: 'pending',  color: 'text-[#eab308]' },
              { label: 'Rejected', key: 'rejected', color: 'text-[#f87171]' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[#c4cad6]">{label}</span>
                <span className={`font-semibold ${color}`}>{(appCounts[key] ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[#c4cad6]">Total</span>
              <span className="font-semibold text-[#e8f4ff]">{totalApplications.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
