import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AdminUserRoleButton from './AdminUserRoleButton'

export const metadata = { title: 'Users — nx8up Admin' }

const PAGE_SIZE = 25

type Props = {
  searchParams: Promise<{ page?: string; role?: string }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page: pageParam, role: roleParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1'))
  const roleFilter = roleParam ?? ''
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const client = await clerkClient()

  const { data: clerkUsers, totalCount } = await client.users.getUserList({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const filtered = roleFilter
    ? clerkUsers.filter(
        (u) => (u.publicMetadata as { role?: string })?.role === roleFilter
      )
    : clerkUsers

  const clerkIds = filtered.map((u) => u.id)

  const [creators, sponsors] = await Promise.all([
    prisma.content_creators.findMany({
      where: { clerk_user_id: { in: clerkIds } },
      select: {
        id: true,
        clerk_user_id: true,
        twitch_username: true,
        youtube_handle: true,
        subs_followers: true,
        youtube_subscribers: true,
        average_vod_views: true,
        platform: true,
        location: true,
        _count: { select: { applications: true } },
      },
    }),
    prisma.sponsors.findMany({
      where: { clerk_user_id: { in: clerkIds } },
      select: {
        id: true,
        clerk_user_id: true,
        company_name: true,
        location: true,
        budget_min: true,
        budget_max: true,
        platform: true,
        _count: { select: { campaigns: true } },
      },
    }),
  ])

  const creatorMap = Object.fromEntries(creators.map((c) => [c.clerk_user_id, c]))
  const sponsorMap = Object.fromEntries(sponsors.map((s) => [s.clerk_user_id, s]))

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(roleFilter ? { role: roleFilter } : {}),
      page: String(page),
      ...overrides,
    })
    return `/admin/users?${params.toString()}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dash-text-bright">Users</h1>
          <p className="text-sm dash-text-muted mt-0.5">
            {totalCount.toLocaleString()} registered user{totalCount !== 1 ? 's' : ''} in Clerk
          </p>
        </div>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All',      value: '' },
          { label: 'Creators', value: 'creator' },
          { label: 'Sponsors', value: 'sponsor' },
          { label: 'Admins',   value: 'admin' },
          { label: 'No role',  value: 'none' },
        ].map(({ label, value }) => (
          <a
            key={value}
            href={buildUrl({ role: value, page: '1' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === value
                ? 'bg-[#00c8ff] text-black'
                : 'dash-panel dash-text-muted hover:dash-text-bright'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="dash-panel p-8 text-center">
          <p className="dash-text-muted text-sm">No users match this filter.</p>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 dash-text-muted font-medium">User</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Role</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Details</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">DB record</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Onboarding</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Joined</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const meta = u.publicMetadata as { role?: string; onboardingComplete?: boolean }
                const userRole = meta?.role ?? null
                const onboarded = meta?.onboardingComplete ?? false
                const creator = creatorMap[u.id]
                const sponsor = sponsorMap[u.id]
                const primaryEmail = u.emailAddresses.find(
                  (e) => e.id === u.primaryEmailAddressId
                )?.emailAddress

                const followers = creator
                  ? Math.max(creator.subs_followers ?? 0, creator.youtube_subscribers ?? 0) || null
                  : null

                return (
                  <tr
                    key={u.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <p className="dash-text-bright font-medium">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                          : <span className="dash-text-muted italic">No name</span>}
                      </p>
                      <p className="text-xs dash-text-muted">{primaryEmail ?? '—'}</p>
                      {creator?.twitch_username && (
                        <p className="text-xs text-[#7b4fff]">@{creator.twitch_username}</p>
                      )}
                      {creator?.youtube_handle && !creator.twitch_username && (
                        <p className="text-xs text-red-400">@{creator.youtube_handle}</p>
                      )}
                      {sponsor?.company_name && (
                        <p className="text-xs text-[#00c8ff]">{sponsor.company_name}</p>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        userRole === 'admin'   ? 'bg-yellow-500/10 text-yellow-400' :
                        userRole === 'sponsor' ? 'bg-[#00c8ff]/10 text-[#00c8ff]' :
                        userRole === 'creator' ? 'bg-[#7b4fff]/10 text-[#7b4fff]' :
                                                 'bg-white/5 dash-text-muted'
                      }`}>
                        {userRole ?? 'none'}
                      </span>
                    </td>

                    {/* Details — creator or sponsor specifics */}
                    <td className="px-4 py-3">
                      {creator && (
                        <div className="space-y-1">
                          {followers != null && (
                            <p className="text-xs dash-text-bright font-medium">
                              {followers.toLocaleString()} followers
                            </p>
                          )}
                          {creator.average_vod_views != null && (
                            <p className="text-xs dash-text-muted">
                              {creator.average_vod_views.toLocaleString()} avg views
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {creator.platform.map(p => (
                              <span key={p} className="text-[11px] px-1.5 py-0.5 rounded bg-[#7b4fff]/10 text-[#7b4fff]">{p}</span>
                            ))}
                          </div>
                          {creator.location && (
                            <p className="text-xs dash-text-muted">{creator.location}</p>
                          )}
                          <p className="text-xs dash-text-muted">
                            {creator._count.applications} application{creator._count.applications !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                      {sponsor && (
                        <div className="space-y-1">
                          {sponsor.budget_min != null && sponsor.budget_max != null && (
                            <p className="text-xs dash-text-bright font-medium">
                              ${sponsor.budget_min.toLocaleString()} – ${sponsor.budget_max.toLocaleString()}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {sponsor.platform.map(p => (
                              <span key={p} className="text-[11px] px-1.5 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{p}</span>
                            ))}
                          </div>
                          {sponsor.location && (
                            <p className="text-xs dash-text-muted">{sponsor.location}</p>
                          )}
                          <p className="text-xs dash-text-muted">
                            {sponsor._count.campaigns} campaign{sponsor._count.campaigns !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                      {!creator && !sponsor && (
                        <span className="text-xs dash-text-muted italic">—</span>
                      )}
                    </td>

                    {/* DB record */}
                    <td className="px-4 py-3">
                      {userRole === 'creator' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          creator ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {creator ? '✓ creator row' : '✗ missing'}
                        </span>
                      )}
                      {userRole === 'sponsor' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          sponsor ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {sponsor ? '✓ sponsor row' : '✗ missing'}
                        </span>
                      )}
                      {!userRole && (
                        <span className="text-xs dash-text-muted italic">—</span>
                      )}
                    </td>

                    {/* Onboarding */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        onboarded ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {onboarded ? '✓ complete' : '⏳ pending'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 dash-text-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AdminUserRoleButton userId={u.id} currentRole={userRole} />
                        {creator && (
                          <Link href={`/admin/users/creators/${creator.id}`} className="text-xs text-[#00c8ff] hover:underline whitespace-nowrap">
                            View
                          </Link>
                        )}
                        {sponsor && (
                          <Link href={`/admin/users/sponsors/${sponsor.id}`} className="text-xs text-[#00c8ff] hover:underline whitespace-nowrap">
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })} className="px-3 py-1.5 rounded-lg dash-panel dash-text-muted hover:dash-text-bright transition-colors">
              ← Previous
            </a>
          )}
          <span className="dash-text-muted">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={buildUrl({ page: String(page + 1) })} className="px-3 py-1.5 rounded-lg dash-panel dash-text-muted hover:dash-text-bright transition-colors">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
