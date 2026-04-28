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

  const [creators, sponsors] = clerkIds.length > 0
    ? await Promise.all([
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
    : [[], []]

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
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
            <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Users</h1>
            <p className="mt-1 text-sm text-[#c4cad6]">
              {totalCount.toLocaleString()} registered user{totalCount !== 1 ? 's' : ''} in Clerk
            </p>
          </div>
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
          <Link
            key={value}
            href={buildUrl({ role: value, page: '1' })}
            prefetch
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              roleFilter === value
                ? 'border border-[#99f7ff]/45 bg-[#99f7ff]/15 text-[#bffcff]'
                : 'border border-white/12 bg-black/20 text-[#a9abb5] hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
          <p className="text-sm text-[#c4cad6]">No users match this filter.</p>
        </div>
      ) : (
        <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-black/25">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">User</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Role</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Details</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">DB record</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Onboarding</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Joined</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8f97ab]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
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
                      <p className="font-medium text-[#e8f4ff]">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : <span className="italic text-[#8f97ab]">No name</span>}
                      </p>
                      <p className="text-xs text-[#a9abb5]">{primaryEmail ?? '—'}</p>
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
                    <td className="px-4 py-3 text-xs text-[#a9abb5]">
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
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-panel interactive-panel flex items-center gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-3 text-sm">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} prefetch className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]">
              ← Previous
            </Link>
          )}
          <span className="text-[#c4cad6]">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} prefetch className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 text-[#a9abb5] transition-colors hover:border-[#99f7ff]/30 hover:text-[#e8f4ff]">
              Next →
            </Link>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
