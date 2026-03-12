import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Creator Detail — nx8up Admin' }

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

  const displayName = creator.twitch_username ?? creator.youtube_handle ?? creator.email

  return (
    <div className="p-6 space-y-6">

      {/* Back */}
      <div>
        <Link href="/admin/creators" className="text-sm dash-text-muted hover:dash-text-bright transition-colors">
          ← Creators
        </Link>
      </div>

      {/* Header */}
      <div className="dash-panel p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold dash-text-bright">{displayName}</h1>
            <p className="text-sm dash-text-muted mt-0.5">{creator.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {creator.platform?.map((p) => (
              <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Core stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="dash-text-muted mb-0.5">Followers</p>
            <p className="dash-text-bright font-semibold">
              {creator.subs_followers != null
                ? creator.subs_followers.toLocaleString()
                : '—'}
            </p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Avg VOD Views</p>
            <p className="dash-text-bright font-semibold">
              {creator.average_vod_views != null
                ? creator.average_vod_views.toLocaleString()
                : '—'}
            </p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Engagement</p>
            <p className="dash-text-bright font-semibold">
              {creator.engagement_rate != null
                ? `${Number(creator.engagement_rate).toFixed(1)}%`
                : '—'}
            </p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Age</p>
            <p className="dash-text-bright font-semibold">{creator.age ?? '—'}</p>
          </div>
        </div>

        {/* Location & language */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="dash-text-muted mb-0.5">Location</p>
            <p className="dash-text-bright">{creator.location ?? '—'}</p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Languages</p>
            <p className="dash-text-bright">
              {creator.language?.length ? creator.language.join(', ') : '—'}
            </p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Joined</p>
            <p className="dash-text-bright">
              {creator.created_at
                ? new Date(creator.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>

        {/* Tags */}
        {creator.game_category?.length > 0 && (
          <div>
            <p className="text-xs dash-text-muted mb-1.5">Game / genre tags</p>
            <div className="flex flex-wrap gap-1.5">
              {creator.game_category.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded text-xs bg-[#7b4fff]/10 text-[#7b4fff]">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {creator.content_type?.length > 0 && (
          <div>
            <p className="text-xs dash-text-muted mb-1.5">Content categories</p>
            <div className="flex flex-wrap gap-1.5">
              {creator.content_type.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded text-xs bg-[#00c8ff]/10 text-[#00c8ff]">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connected platforms */}
      <div>
        <h2 className="text-base font-semibold dash-text-bright mb-3">Connected Platforms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Twitch */}
          <div className="dash-panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7b4fff]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
              </svg>
              <span className="text-sm font-medium dash-text-bright">Twitch</span>
              {creator.twitch_username ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 ml-auto">Connected</span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 dash-text-muted ml-auto">Not connected</span>
              )}
            </div>
            {creator.twitch_username && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="dash-text-muted">Username</span>
                  <span className="dash-text-bright">@{creator.twitch_username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dash-text-muted">Type</span>
                  <span className="dash-text-bright capitalize">
                    {creator.twitch_broadcaster_type || 'standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dash-text-muted">Followers</span>
                  <span className="dash-text-bright">
                    {creator.subs_followers?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dash-text-muted">Avg VOD views</span>
                  <span className="dash-text-bright">
                    {creator.average_vod_views?.toLocaleString() ?? '—'}
                  </span>
                </div>
                {creator.twitch_synced_at && (
                  <div className="flex justify-between">
                    <span className="dash-text-muted">Last synced</span>
                    <span className="text-xs dash-text-muted">
                      {new Date(creator.twitch_synced_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* YouTube */}
          <div className="dash-panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="text-sm font-medium dash-text-bright">YouTube</span>
              {creator.youtube_channel_id ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 ml-auto">Connected</span>
              ) : (
                <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 dash-text-muted ml-auto">Not connected</span>
              )}
            </div>
            {creator.youtube_channel_id && (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="dash-text-muted">Handle</span>
                  <span className="dash-text-bright">
                    {creator.youtube_handle ? `@${creator.youtube_handle}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dash-text-muted">Channel</span>
                  <span className="dash-text-bright">{creator.youtube_channel_name ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dash-text-muted">Subscribers</span>
                  <span className="dash-text-bright">
                    {creator.youtube_subscribers?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dash-text-muted">Avg views</span>
                  <span className="dash-text-bright">
                    {creator.youtube_avg_views?.toLocaleString() ?? '—'}
                  </span>
                </div>
                {creator.youtube_top_categories?.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="dash-text-muted">Categories</span>
                    <span className="dash-text-bright text-right">
                      {creator.youtube_top_categories.join(', ')}
                    </span>
                  </div>
                )}
                {creator.youtube_synced_at && (
                  <div className="flex justify-between">
                    <span className="dash-text-muted">Last synced</span>
                    <span className="text-xs dash-text-muted">
                      {new Date(creator.youtube_synced_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applications */}
      <div>
        <h2 className="text-base font-semibold dash-text-bright mb-3">
          Campaign Applications ({creator.applications.length})
        </h2>

        {creator.applications.length === 0 ? (
          <div className="dash-panel p-6 text-center">
            <p className="dash-text-muted text-sm">No applications submitted yet.</p>
          </div>
        ) : (
          <div className="dash-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 dash-text-muted font-medium">Campaign</th>
                  <th className="text-left px-4 py-3 dash-text-muted font-medium">Sponsor</th>
                  <th className="text-left px-4 py-3 dash-text-muted font-medium">Status</th>
                  <th className="text-left px-4 py-3 dash-text-muted font-medium">Message</th>
                  <th className="text-left px-4 py-3 dash-text-muted font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {creator.applications.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      i === creator.applications.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3 dash-text-bright font-medium">
                      {a.campaign.title}
                    </td>
                    <td className="px-4 py-3 dash-text-muted">
                      {a.campaign.sponsor.company_name ?? a.campaign.sponsor.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          a.status === 'accepted'
                            ? 'bg-green-500/10 text-green-400'
                            : a.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-[#7b4fff]/10 text-[#7b4fff]'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 dash-text-muted max-w-[200px]">
                      {a.message ? (
                        <span className="truncate block" title={a.message}>
                          {a.message.length > 60 ? a.message.slice(0, 60) + '…' : a.message}
                        </span>
                      ) : (
                        <span className="italic opacity-40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 dash-text-muted text-xs">
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}