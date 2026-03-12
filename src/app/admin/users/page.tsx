import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
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

  // Fetch users from Clerk — supports offset pagination
  const { data: clerkUsers, totalCount } = await client.users.getUserList({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Filter by role client-side (Clerk doesn't support filtering by metadata server-side)
  const filtered = roleFilter
    ? clerkUsers.filter(
        (u) => (u.publicMetadata as { role?: string })?.role === roleFilter
      )
    : clerkUsers

  // Build lookup maps for DB records
  const clerkIds = filtered.map((u) => u.id)
  const [creators, sponsors] = await Promise.all([
    prisma.content_creators.findMany({
      where: { clerk_user_id: { in: clerkIds } },
      select: { clerk_user_id: true, twitch_username: true, subs_followers: true },
    }),
    prisma.sponsors.findMany({
      where: { clerk_user_id: { in: clerkIds } },
      select: { clerk_user_id: true, company_name: true },
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
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { label: 'All', value: '' },
          { label: 'Creators', value: 'creator' },
          { label: 'Sponsors', value: 'sponsor' },
          { label: 'Admins', value: 'admin' },
          { label: 'No role', value: 'none' },
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
                <th className="text-left px-4 py-3 dash-text-muted font-medium">DB record</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Onboarding</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Joined</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const meta = u.publicMetadata as {
                  role?: string
                  onboardingComplete?: boolean
                }
                const userRole = meta?.role ?? null
                const onboarded = meta?.onboardingComplete ?? false
                const creator = creatorMap[u.id]
                const sponsor = sponsorMap[u.id]
                const primaryEmail = u.emailAddresses.find(
                  (e) => e.id === u.primaryEmailAddressId
                )?.emailAddress

                return (
                  <tr
                    key={u.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      i === filtered.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
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
                      {sponsor?.company_name && (
                        <p className="text-xs text-[#00c8ff]">{sponsor.company_name}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          userRole === 'admin'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : userRole === 'sponsor'
                            ? 'bg-[#00c8ff]/10 text-[#00c8ff]'
                            : userRole === 'creator'
                            ? 'bg-[#7b4fff]/10 text-[#7b4fff]'
                            : 'bg-white/5 dash-text-muted'
                        }`}
                      >
                        {userRole ?? 'none'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {userRole === 'creator' && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            creator
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {creator ? '✓ creator row' : '✗ missing'}
                        </span>
                      )}
                      {userRole === 'sponsor' && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            sponsor
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {sponsor ? '✓ sponsor row' : '✗ missing'}
                        </span>
                      )}
                      {!userRole && (
                        <span className="text-xs dash-text-muted italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          onboarded
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {onboarded ? '✓ complete' : '⏳ pending'}
                      </span>
                    </td>

                    <td className="px-4 py-3 dash-text-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <AdminUserRoleButton
                        userId={u.id}
                        currentRole={userRole}
                      />
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
          <span className="dash-text-muted">
            Page {page} of {totalPages}
          </span>
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