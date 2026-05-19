import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Creator Detail — nx8up Admin' }

const APP_STATUS_STYLES: Record<string, string> = {
  accepted:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  rejected:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
  pending:
    'rounded-full border border-[#c084fc]/35 bg-[#c084fc]/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#d8b4fe]',
}

function formatNum(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toLocaleString()
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="sp-app-stat-label shrink-0">{label}</span>
      <span className="sp-app-stat-value text-right">{children}</span>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sp-app-stat-panel rounded-lg p-3">
      <p className="sp-app-stat-label">{label}</p>
      <p className="sp-app-stat-value mt-1 tabular-nums">{value}</p>
    </div>
  )
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="ml-auto rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2 py-0.5 text-xs font-semibold text-[#86efac]">
      Connected
    </span>
  ) : (
    <span className="ml-auto rounded-full border border-slate-400/35 bg-slate-500/15 px-2 py-0.5 text-xs font-semibold text-slate-200">
      Not connected
    </span>
  )
}

type Props = { params: Promise<{ id: string }> }

export default async function AdminCreatorDetailPage({ params }: Props) {
  const { sessionClaims } = await auth()
  const { id } = await params
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const creator = await prisma.content_creators.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { submitted_at: 'desc' },
        include: {
          campaign: {
            include: { sponsor: true },
          },
        },
      },
    },
  })

  if (!creator) notFound()

  const displayName =
    creator.twitch_username ?? creator.youtube_handle ?? creator.youtube_channel_name ?? creator.email
  const totalFollowers = (creator.subs_followers ?? 0) + (creator.youtube_subscribers ?? 0)

  return (
    <div className="admin-users admin-users-detail mx-auto max-w-5xl space-y-6 p-6 sm:p-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
      >
        <span aria-hidden>&larr;</span>
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {creator.is_deleted && (
              <span className="rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fca5a5]">
                Deleted
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                creator.is_available
                  ? 'border border-[#22c55e]/40 bg-[#22c55e]/15 text-[#86efac]'
                  : 'border border-slate-400/40 bg-slate-500/20 text-slate-200'
              }`}
            >
              {creator.is_available ? 'Available' : 'Unavailable'}
            </span>
            {creator.creator_size && (
              <span className="rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#99f7ff]">
                {creator.creator_size}
              </span>
            )}
          </div>
          <p className="cr-field-label">Creator account</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">{displayName}</h1>
          <p className="mt-2 text-sm cr-text-muted">{creator.email}</p>
          {creator.platform?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {creator.platform.map(p => (
                <span
                  key={p}
                  className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
          <p className="font-headline text-2xl font-semibold tabular-nums text-[#99f7ff]">
            {formatNum(totalFollowers)}
          </p>
          <p className="sp-app-stat-label mt-0.5">Total followers</p>
        </div>
      </div>

      {/* Key metrics */}
      <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 sm:p-5">
        <h2 className="cr-panel-title">Overview</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell label="Twitch followers" value={formatNum(creator.subs_followers)} />
          <StatCell label="Avg VOD views" value={formatNum(creator.average_vod_views)} />
          <StatCell
            label="Engagement"
            value={
              creator.engagement_rate != null
                ? `${Number(creator.engagement_rate).toFixed(1)}%`
                : '—'
            }
          />
          <StatCell label="Age" value={creator.age ?? '—'} />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCell label="Location" value={creator.location ?? '—'} />
          <StatCell
            label="Languages"
            value={creator.language?.length ? creator.language.join(', ') : '—'}
          />
          <StatCell label="Joined" value={formatDate(creator.created_at)} />
        </div>

        {(creator.game_category?.length > 0 || creator.content_type?.length > 0) && (
          <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
            {creator.game_category?.length > 0 && (
              <div>
                <p className="sp-app-stat-label mb-1.5">Game / genre tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {creator.game_category.map(g => (
                    <span
                      key={g}
                      className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {creator.content_type?.length > 0 && (
              <div>
                <p className="sp-app-stat-label mb-1.5">Content categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {creator.content_type.map(c => (
                    <span
                      key={c}
                      className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Connected platforms */}
      <section>
        <h2 className="cr-panel-title mb-3 px-1">Connected platforms</h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Twitch */}
          <div className="sp-app-stat-panel rounded-xl p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
              <svg className="h-4 w-4 text-[#a970ff]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
              </svg>
              <span className="text-sm font-semibold text-[#e8f4ff]">Twitch</span>
              <ConnectionBadge connected={Boolean(creator.twitch_username)} />
            </div>
            {creator.twitch_username ? (
              <dl className="space-y-2">
                <SideRow label="Username">@{creator.twitch_username}</SideRow>
                <SideRow label="Type">
                  <span className="capitalize">{creator.twitch_broadcaster_type || 'standard'}</span>
                </SideRow>
                <SideRow label="Followers">{formatNum(creator.subs_followers)}</SideRow>
                <SideRow label="Avg VOD views">{formatNum(creator.average_vod_views)}</SideRow>
                {creator.twitch_synced_at && (
                  <SideRow label="Last synced">{formatDate(creator.twitch_synced_at)}</SideRow>
                )}
              </dl>
            ) : (
              <p className="text-sm cr-text-muted">No Twitch account linked.</p>
            )}
          </div>

          {/* YouTube */}
          <div className="sp-app-stat-panel rounded-xl p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
              <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span className="text-sm font-semibold text-[#e8f4ff]">YouTube</span>
              <ConnectionBadge connected={Boolean(creator.youtube_channel_id)} />
            </div>
            {creator.youtube_channel_id ? (
              <dl className="space-y-2">
                <SideRow label="Handle">
                  {creator.youtube_handle ? `@${creator.youtube_handle}` : '—'}
                </SideRow>
                <SideRow label="Channel">{creator.youtube_channel_name ?? '—'}</SideRow>
                <SideRow label="Subscribers">{formatNum(creator.youtube_subscribers)}</SideRow>
                <SideRow label="Avg views">{formatNum(creator.youtube_avg_views)}</SideRow>
                {creator.youtube_top_categories?.length > 0 && (
                  <SideRow label="Categories">
                    <span className="max-w-[140px] text-right">{creator.youtube_top_categories.join(', ')}</span>
                  </SideRow>
                )}
                {creator.youtube_synced_at && (
                  <SideRow label="Last synced">{formatDate(creator.youtube_synced_at)}</SideRow>
                )}
              </dl>
            ) : (
              <p className="text-sm cr-text-muted">No YouTube channel linked.</p>
            )}
          </div>

          {/* Steam */}
          <div className="sp-app-stat-panel rounded-xl p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
              <svg className="h-4 w-4 text-[#66c0f4]" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16 0C7.5 0 0.6 6.6 0 14.9l8.6 3.6c0.7-0.5 1.6-0.8 2.6-0.8 0.1 0 0.2 0 0.3 0l3.8-5.5c0-2.6 2.1-4.7 4.7-4.7 2.6 0 4.7 2.1 4.7 4.7 0 2.6-2.1 4.7-4.7 4.7-0.1 0-0.1 0-0.2 0l-5.4 3.9c0 0.1 0 0.2 0 0.3 0 2.5-2 4.5-4.5 4.5-2.2 0-4-1.5-4.4-3.6L0.4 19.5C2.3 26.6 8.5 32 16 32c8.8 0 16-7.2 16-16C32 7.2 24.8 0 16 0zM10 24.3l-1.9-0.8c0.3 0.7 0.9 1.3 1.7 1.6 1.7 0.7 3.6-0.1 4.3-1.8 0.3-0.8 0.3-1.7 0-2.5-0.3-0.8-1-1.4-1.7-1.7-0.8-0.3-1.6-0.3-2.3 0l2 0.8c1.2 0.5 1.8 1.9 1.3 3.1S11.2 24.8 10 24.3zM23.1 14.9c1.7 0 3.1-1.4 3.1-3.1 0-1.7-1.4-3.1-3.1-3.1-1.7 0-3.1 1.4-3.1 3.1C20 13.5 21.4 14.9 23.1 14.9zM23.1 9.4c1.3 0 2.4 1.1 2.4 2.4 0 1.3-1.1 2.4-2.4 2.4-1.3 0-2.4-1.1-2.4-2.4C20.7 10.5 21.8 9.4 23.1 9.4z"
                />
              </svg>
              <span className="text-sm font-semibold text-[#e8f4ff]">Steam</span>
              <ConnectionBadge connected={Boolean(creator.steam_id)} />
            </div>
            {creator.steam_id ? (
              <dl className="space-y-2">
                <SideRow label="Username">{creator.steam_username ?? '—'}</SideRow>
                <SideRow label="Steam ID">
                  <span className="font-mono text-xs">{creator.steam_id}</span>
                </SideRow>
                {creator.steam_profile_url && (
                  <SideRow label="Profile">
                    <a
                      href={creator.steam_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#bcdcf2] hover:text-[#99f7ff]"
                    >
                      View ↗
                    </a>
                  </SideRow>
                )}
                {creator.steam_synced_at && (
                  <SideRow label="Last synced">{formatDate(creator.steam_synced_at)}</SideRow>
                )}
              </dl>
            ) : (
              <p className="text-sm cr-text-muted">No Steam account linked.</p>
            )}
          </div>
        </div>
      </section>

      {/* Applications */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
          <h2 className="cr-panel-title">Campaign applications</h2>
          <span className="rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-medium text-[#bffcff]">
            {creator.applications.length}
          </span>
        </div>

        {creator.applications.length === 0 ? (
          <div className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-8 text-center">
            <p className="text-sm font-medium text-[#e8f4ff]">No applications yet</p>
            <p className="mt-1 text-sm cr-text-muted">This creator has not applied to any campaigns.</p>
          </div>
        ) : (
          <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20">
            <table className="sp-ledger-table w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Sponsor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {creator.applications.map((a, i) => {
                  const statusStyle =
                    APP_STATUS_STYLES[a.status] ??
                    'rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-200'
                  return (
                    <tr
                      key={a.id}
                      className={`border-b border-white/5 ${
                        i === creator.applications.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-[#e8f4ff]">{a.campaign.title}</td>
                      <td className="px-4 py-3 cr-stat-caption">
                        {a.campaign.sponsor.company_name ?? a.campaign.sponsor.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusStyle}>{a.status}</span>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 cr-stat-caption">
                        {a.message ? (
                          <span className="block truncate" title={a.message}>
                            {a.message.length > 60 ? `${a.message.slice(0, 60)}…` : a.message}
                          </span>
                        ) : (
                          <span className="italic opacity-60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs cr-stat-caption">
                        {formatDate(a.submitted_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
