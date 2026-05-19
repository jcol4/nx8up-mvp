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

  const { totalCount } = await client.users.getUserList({ limit: 1, offset: 0 })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const { data: clerkUsers } = await client.users.getUserList({
    limit: PAGE_SIZE,
    offset: (safePage - 1) * PAGE_SIZE,
  })

  const filtered = roleFilter
    ? clerkUsers.filter((u) => (u.publicMetadata as { role?: string })?.role === roleFilter)
    : clerkUsers

  let tallyCreator = 0
  let tallySponsor = 0
  let tallyAdmin = 0
  let tallyNone = 0
  for (const u of clerkUsers) {
    const r = (u.publicMetadata as { role?: string })?.role ?? null
    if (r === 'creator') tallyCreator++
    else if (r === 'sponsor') tallySponsor++
    else if (r === 'admin') tallyAdmin++
    else tallyNone++
  }

  const clerkIds = filtered.map((u) => u.id)

  const [creators, sponsors] =
    clerkIds.length > 0
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

  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(roleFilter ? { role: roleFilter } : {}),
      page: String(safePage),
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
              <p className="text-nx-11 uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
              <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Users</h1>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-sm">
                <span className="tabular-nums">
                  <span className="font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    {totalCount.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-white/55">
                    total
                  </span>
                </span>
                <span className="select-none text-white/20" aria-hidden>
                  ·
                </span>
                <span className="tabular-nums">
                  <span className="font-bold text-[#a78bfa] drop-shadow-[0_0_8px_rgba(167,139,250,0.2)]">
                    {tallyCreator}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#c4b5fd]/90">
                    creators
                  </span>
                </span>
                <span className="select-none text-white/20" aria-hidden>
                  ·
                </span>
                <span className="tabular-nums">
                  <span className="font-bold text-[#bffcff] drop-shadow-[0_0_10px_rgba(153,247,255,0.2)]">
                    {tallySponsor}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#99f7ff]/90">
                    sponsors
                  </span>
                </span>
                <span className="select-none text-white/20" aria-hidden>
                  ·
                </span>
                <span className="tabular-nums">
                  <span className="font-bold text-[#fde047] drop-shadow-[0_0_8px_rgba(234,179,8,0.15)]">
                    {tallyAdmin}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-[#fef08a]/90">
                    admins
                  </span>
                </span>
                <span className="select-none text-white/20" aria-hidden>
                  ·
                </span>
                <span className="tabular-nums">
                  <span className="font-bold text-[#cbd5e1] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                    {tallyNone}
                  </span>
                  <span className="ml-1.5 text-nx-10 font-semibold uppercase tracking-[0.14em] text-white/50">
                    no role
                  </span>
                </span>
                <span className="ml-2 text-nx-9 font-medium uppercase tracking-[0.12em] text-white/35">
                  (this page)
                </span>
              </div>
            </div>
            {totalCount > 0 && (
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-white/90">
                  {startIndex + 1}-{endIndex} of {totalCount}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildUrl({ page: String(Math.max(1, safePage - 1)) })}
                      prefetch
                      aria-disabled={safePage <= 1}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                        safePage <= 1
                          ? 'pointer-events-none border-white/10 text-white/30'
                          : 'border-[#99f7ff]/30 text-[#99f7ff] hover:bg-[#99f7ff]/10'
                      }`}
                    >
                      &larr;
                    </Link>
                    <Link
                      href={buildUrl({ page: String(Math.min(totalPages, safePage + 1)) })}
                      prefetch
                      aria-disabled={safePage >= totalPages}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition ${
                        safePage >= totalPages
                          ? 'pointer-events-none border-white/10 text-white/30'
                          : 'border-[#99f7ff]/30 text-[#99f7ff] hover:bg-[#99f7ff]/10'
                      }`}
                    >
                      &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                {
                  label: 'All',
                  value: '',
                  activeClass:
                    'border-[#99f7ff]/50 bg-[#99f7ff]/18 text-[#bffcff] shadow-[0_0_20px_rgba(153,247,255,0.12)]',
                  idleClass: 'border-white/10 bg-black/30 text-white/80 hover:border-[#99f7ff]/30',
                },
                {
                  label: 'Creators',
                  value: 'creator',
                  activeClass: 'border-[#a78bfa]/45 bg-[#7c3aed]/15 text-[#ddd6fe]',
                  idleClass: 'border-[#a78bfa]/25 bg-[#7c3aed]/[0.08] text-[#c4b5fd]/90 hover:border-[#a78bfa]/40',
                },
                {
                  label: 'Sponsors',
                  value: 'sponsor',
                  activeClass: 'border-[#99f7ff]/50 bg-[#99f7ff]/18 text-[#bffcff]',
                  idleClass: 'border-[#99f7ff]/20 bg-[#99f7ff]/[0.07] text-[#a5f3fc]/90 hover:border-[#99f7ff]/35',
                },
                {
                  label: 'Admins',
                  value: 'admin',
                  activeClass: 'border-[#eab308]/45 bg-[#eab308]/15 text-[#fde047]',
                  idleClass: 'border-[#eab308]/20 bg-[#eab308]/[0.07] text-[#fcd34d]/90 hover:border-[#eab308]/40',
                },
                {
                  label: 'No role',
                  value: 'none',
                  activeClass: 'border-white/35 bg-white/12 text-white',
                  idleClass: 'border-white/10 bg-black/30 text-white/70 hover:border-white/25',
                },
              ].map(({ label, value, activeClass, idleClass }) => (
                <Link
                  key={value}
                  href={buildUrl({ role: value, page: '1' })}
                  prefetch
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all ${
                    roleFilter === value ? activeClass : idleClass
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center">
            <p className="text-sm font-medium text-white/90">No users match this filter.</p>
          </div>
        ) : (
          <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr className="border-b-2 border-[#99f7ff]/35 bg-gradient-to-r from-black/55 via-[#070d14] to-black/50">
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">User</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Role</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Details</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">DB record</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Onboarding</th>
                    <th className="px-4 py-3.5 text-left text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Joined</th>
                    <th className="px-4 py-3.5 text-right text-nx-10 font-bold uppercase tracking-[0.2em] text-[#bffcff]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((u, i) => {
                    const meta = u.publicMetadata as { role?: string; onboardingComplete?: boolean }
                    const userRole = meta?.role ?? null
                    const onboarded = meta?.onboardingComplete ?? false
                    const creator = creatorMap[u.id]
                    const sponsor = sponsorMap[u.id]
                    const primaryEmail = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress

                    const followers = creator
                      ? Math.max(creator.subs_followers ?? 0, creator.youtube_subscribers ?? 0) || null
                      : null

                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-white/[0.04] transition-colors hover:bg-[#99f7ff]/[0.06] ${
                          i % 2 === 0 ? 'bg-black/[0.12]' : 'bg-transparent'
                        } ${i === filtered.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <td className="px-4 py-3 align-top">
                          <p className="font-semibold text-[#f4fdff]">
                            {u.firstName || u.lastName ? (
                              `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                            ) : (
                              <span className="italic text-white/75">No name</span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs font-medium tracking-wide text-[#99f7ff]/75">{primaryEmail ?? '—'}</p>
                          {creator?.twitch_username && (
                            <p className="mt-0.5 text-xs font-medium text-[#a78bfa]">@{creator.twitch_username}</p>
                          )}
                          {creator?.youtube_handle && !creator.twitch_username && (
                            <p className="mt-0.5 text-xs font-medium text-red-400/90">@{creator.youtube_handle}</p>
                          )}
                          {sponsor?.company_name && (
                            <p className="mt-0.5 text-xs font-medium text-[#99f7ff]/85">{sponsor.company_name}</p>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-nx-11 font-semibold capitalize ${
                              userRole === 'admin'
                                ? 'border-[#eab308]/35 bg-[#eab308]/12 text-[#fde047]'
                                : userRole === 'sponsor'
                                  ? 'border-[#99f7ff]/35 bg-[#99f7ff]/10 text-[#bffcff]'
                                  : userRole === 'creator'
                                    ? 'border-[#a78bfa]/35 bg-[#7c3aed]/12 text-[#ddd6fe]'
                                    : 'border-white/20 bg-white/[0.06] text-white/85'
                            }`}
                          >
                            {userRole ?? 'none'}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-top">
                          {creator && (
                            <div className="space-y-1">
                              {followers != null && (
                                <p className="text-xs font-semibold text-white">{followers.toLocaleString()} followers</p>
                              )}
                              {creator.average_vod_views != null && (
                                <p className="text-xs font-medium text-white/80">
                                  {creator.average_vod_views.toLocaleString()} avg views
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {creator.platform.map((p) => (
                                  <span
                                    key={p}
                                    className="rounded-md border border-[#a78bfa]/25 bg-[#7c3aed]/10 px-1.5 py-0.5 text-nx-11 font-medium text-[#ddd6fe]"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                              {creator.location && (
                                <p className="text-xs font-medium text-white/80">{creator.location}</p>
                              )}
                              <p className="text-xs font-medium text-white/80">
                                {creator._count.applications} application{creator._count.applications !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                          {sponsor && (
                            <div className="space-y-1">
                              {sponsor.budget_min != null && sponsor.budget_max != null && (
                                <p className="text-xs font-semibold text-white">
                                  ${sponsor.budget_min.toLocaleString()} – ${sponsor.budget_max.toLocaleString()}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {sponsor.platform.map((p) => (
                                  <span
                                    key={p}
                                    className="rounded-md border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-1.5 py-0.5 text-nx-11 font-medium text-[#bffcff]"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                              {sponsor.location && (
                                <p className="text-xs font-medium text-white/80">{sponsor.location}</p>
                              )}
                              <p className="text-xs font-medium text-white/80">
                                {sponsor._count.campaigns} campaign{sponsor._count.campaigns !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                          {!creator && !sponsor && (
                            <span className="text-xs font-medium italic text-white/40">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-top">
                          {userRole === 'creator' && (
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-nx-11 font-semibold ${
                                creator
                                  ? 'border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]'
                                  : 'border-red-400/35 bg-red-500/10 text-[#fca5a5]'
                              }`}
                            >
                              {creator ? '✓ creator row' : '✗ missing'}
                            </span>
                          )}
                          {userRole === 'sponsor' && (
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-nx-11 font-semibold ${
                                sponsor
                                  ? 'border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]'
                                  : 'border-red-400/35 bg-red-500/10 text-[#fca5a5]'
                              }`}
                            >
                              {sponsor ? '✓ sponsor row' : '✗ missing'}
                            </span>
                          )}
                          {!userRole && <span className="text-xs font-medium italic text-white/40">—</span>}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-nx-11 font-semibold ${
                              onboarded
                                ? 'border-[#22c55e]/35 bg-[#22c55e]/12 text-[#86efac]'
                                : 'border-[#eab308]/35 bg-[#eab308]/12 text-[#fde047]'
                            }`}
                          >
                            {onboarded ? '✓ complete' : '⏳ pending'}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-top text-xs font-semibold tabular-nums text-[#99f7ff]/90">
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="px-4 py-3 align-top text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {creator && (
                                <Link
                                  href={`/admin/users/creators/${creator.id}`}
                                  className="whitespace-nowrap text-nx-11 font-semibold text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                                >
                                  View
                                </Link>
                              )}
                              {sponsor && (
                                <Link
                                  href={`/admin/users/sponsors/${sponsor.id}`}
                                  className="whitespace-nowrap text-nx-11 font-semibold text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                                >
                                  View
                                </Link>
                              )}
                            </div>
                            <AdminUserRoleButton userId={u.id} currentRole={userRole} />
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

        {totalPages > 1 && (
          <div className="glass-panel interactive-panel flex items-center gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-3 text-sm">
            {safePage > 1 && (
              <Link
                href={buildUrl({ page: String(safePage - 1) })}
                prefetch
                className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 font-medium text-white/90 transition-colors hover:border-[#99f7ff]/35 hover:text-[#bffcff]"
              >
                ← Previous
              </Link>
            )}
            <span className="font-medium text-white/90">
              Page {safePage} of {totalPages}
            </span>
            {safePage < totalPages && (
              <Link
                href={buildUrl({ page: String(safePage + 1) })}
                prefetch
                className="rounded-lg border border-white/12 bg-black/20 px-3 py-1.5 font-medium text-white/90 transition-colors hover:border-[#99f7ff]/35 hover:text-[#bffcff]"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
