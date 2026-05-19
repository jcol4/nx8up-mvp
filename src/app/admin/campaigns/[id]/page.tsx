import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Campaign Detail — nx8up Admin' }

type Props = { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  live:      'bg-[#22c55e]/20 text-[#22c55e]',
  draft:     'bg-[#94a3b8]/20 text-[#94a3b8]',
  cancelled: 'bg-[#f87171]/20 text-[#f87171]',
}

const APP_STATUS_STYLE: Record<string, string> = {
  accepted: 'bg-[#22c55e]/20 text-[#22c55e]',
  pending:  'bg-[#eab308]/20 text-[#eab308]',
  rejected: 'bg-[#f87171]/20 text-[#f87171]',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="mb-0.5 text-nx-11 font-semibold uppercase tracking-[0.14em] text-white/90">{label}</p>
      <p className="text-sm text-[#e8f4ff]">{value ?? '—'}</p>
    </div>
  )
}

export default async function AdminCampaignDetailPage({ params }: Props) {
  const { id } = await params
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const campaign = await prisma.campaigns.findUnique({
    where: { id },
    include: {
      sponsor: true,
      applications: {
        orderBy: { submitted_at: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              twitch_username: true,
              youtube_handle: true,
              subs_followers: true,
              youtube_subscribers: true,
              average_vod_views: true,
              location: true,
              platform: true,
            },
          },
        },
      },
    },
  })

  if (!campaign) notFound()

  const accepted = campaign.applications.filter(a => a.status === 'accepted')
  const pending  = campaign.applications.filter(a => a.status === 'pending')
  const rejected = campaign.applications.filter(a => a.status === 'rejected')

  const hasDeliverables = campaign.num_videos || campaign.num_streams || campaign.num_posts || campaign.num_short_videos

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-nx-11 uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
              <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Campaign Detail</h1>
              <p className="mt-1 text-sm font-medium text-white/90">{campaign.title}</p>
            </div>
            <Link
              href="/admin/campaigns"
              className="inline-flex items-center gap-2 rounded-md border border-[#99f7ff]/25 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#99f7ff] transition hover:bg-[#99f7ff]/10"
            >
              <span aria-hidden>←</span>
              Campaigns
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {campaign.platform.map((p) => (
                      <span key={p} className="rounded-full border border-[#00c8ff]/20 bg-[#00c8ff]/10 px-2 py-0.5 text-nx-11 text-[#00c8ff]">
                        {p}
                      </span>
                    ))}
                    {campaign.content_type.map((t) => (
                      <span key={t} className="rounded-full border border-[#99f7ff]/20 bg-[#99f7ff]/10 px-2 py-0.5 text-nx-11 text-[#99f7ff]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-semibold text-[#e8f4ff]">{campaign.title}</h2>
                  {campaign.description && (
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/90">{campaign.description}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[campaign.status] ?? 'bg-[#eab308]/20 text-[#eab308]'}`}>
                  {campaign.status}
                </span>
              </div>

              {campaign.game_category.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                  {campaign.game_category.map((g) => (
                    <span key={g} className="rounded bg-[#00c8ff]/10 px-2 py-0.5 text-nx-11 text-[#00c8ff]">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
              <h3 className="mb-4 text-sm font-semibold text-[#e8f4ff]">Campaign Details</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Row label="Budget" value={campaign.budget != null ? `$${campaign.budget.toLocaleString()}` : null} />
                <Row label="Payment model" value={campaign.payment_model} />
                <Row label="Campaign type" value={campaign.campaign_type} />
                <Row label="Brand" value={campaign.brand_name} />
                <Row label="Product" value={campaign.product_name} />
                <Row label="Product type" value={campaign.product_type} />
                <Row label="Objective" value={campaign.objective} />
                <Row label="Spots" value={campaign.creator_count} />
                <Row label="Applicants" value={campaign.applications.length} />
                {campaign.start_date && (
                  <Row label="Start date" value={new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                )}
                {campaign.end_date && (
                  <Row label="End date" value={new Date(campaign.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                )}
              </div>
            </div>

            {(campaign.min_subs_followers || campaign.min_avg_viewers || campaign.min_engagement_rate ||
              campaign.creator_types.length > 0 || campaign.creator_sizes.length > 0) && (
              <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#e8f4ff]">Creator Requirements</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {campaign.min_subs_followers != null && (
                    <Row label="Min followers" value={campaign.min_subs_followers.toLocaleString()} />
                  )}
                  {campaign.min_avg_viewers != null && (
                    <Row label="Min avg viewers" value={campaign.min_avg_viewers.toLocaleString()} />
                  )}
                  {campaign.min_engagement_rate != null && (
                    <Row label="Min CTR" value={`${Number(campaign.min_engagement_rate).toFixed(1)}%`} />
                  )}
                  {(campaign.min_audience_age != null || campaign.max_audience_age != null) && (
                    <Row label="Audience age" value={`${campaign.min_audience_age ?? '?'}–${campaign.max_audience_age ?? '?'}`} />
                  )}
                </div>
                {campaign.creator_types.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-nx-11 font-semibold uppercase tracking-[0.14em] text-white/90">Creator types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.creator_types.map((t) => (
                        <span key={t} className="rounded bg-white/5 px-2 py-0.5 text-xs font-medium capitalize text-white/90">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {campaign.creator_sizes.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-nx-11 font-semibold uppercase tracking-[0.14em] text-white/90">Creator sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.creator_sizes.map((s) => (
                        <span key={s} className="rounded bg-white/5 px-2 py-0.5 text-xs font-medium capitalize text-white/90">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {campaign.required_audience_locations.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1.5 text-nx-11 font-semibold uppercase tracking-[0.14em] text-white/90">Required audience locations</p>
                    <p className="text-sm text-[#e8f4ff]">{campaign.required_audience_locations.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {hasDeliverables && (
              <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#e8f4ff]">Content Deliverables</h3>
                <div className="flex flex-wrap gap-4">
                  {campaign.num_videos != null && campaign.num_videos > 0 && (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-[#e8f4ff]">{campaign.num_videos}</p>
                      <p className="text-nx-11 font-medium text-white/85">Video{campaign.num_videos !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {campaign.num_streams != null && campaign.num_streams > 0 && (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-[#e8f4ff]">{campaign.num_streams}</p>
                      <p className="text-nx-11 font-medium text-white/85">Stream{campaign.num_streams !== 1 ? 's' : ''}</p>
                      {campaign.min_stream_duration && (
                        <p className="text-nx-10 font-medium text-white/75">{campaign.min_stream_duration}h min</p>
                      )}
                    </div>
                  )}
                  {campaign.num_posts != null && campaign.num_posts > 0 && (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-[#e8f4ff]">{campaign.num_posts}</p>
                      <p className="text-nx-11 font-medium text-white/85">Post{campaign.num_posts !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {campaign.num_short_videos != null && campaign.num_short_videos > 0 && (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-[#e8f4ff]">{campaign.num_short_videos}</p>
                      <p className="text-nx-11 font-medium text-white/85">Short{campaign.num_short_videos !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
                {campaign.content_guidelines && (
                  <p className="mt-4 border-t border-white/5 pt-3 text-xs font-medium leading-relaxed text-white/90">
                    {campaign.content_guidelines}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">Sponsor</h3>
                <Link href={`/admin/users/sponsors/${campaign.sponsor.id}`} className="text-xs font-semibold text-[#99f7ff] hover:text-[#bffcff] hover:underline">
                  View profile →
                </Link>
              </div>
              <div>
                <p className="font-semibold text-[#e8f4ff]">{campaign.sponsor.company_name ?? 'Unnamed'}</p>
                <p className="mt-0.5 text-xs font-medium text-white/90">{campaign.sponsor.email}</p>
              </div>
              {campaign.sponsor.location && (
                <p className="mt-2 text-xs font-medium text-white/90">{campaign.sponsor.location}</p>
              )}
              {campaign.sponsor.budget_min != null && campaign.sponsor.budget_max != null && (
                <div className="mt-3">
                  <p className="mb-0.5 text-nx-11 font-semibold uppercase tracking-[0.14em] text-white/90">Budget range</p>
                  <p className="text-sm text-[#e8f4ff]">
                    ${campaign.sponsor.budget_min.toLocaleString()} – ${campaign.sponsor.budget_max.toLocaleString()}
                  </p>
                </div>
              )}
              {campaign.sponsor.platform?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {campaign.sponsor.platform.map((p) => (
                    <span key={p} className="rounded bg-[#00c8ff]/10 px-1.5 py-0.5 text-nx-11 text-[#00c8ff]">{p}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/90">Applications</h3>
              <div className="space-y-2">
                {[
                  { label: 'Accepted', count: accepted.length, color: 'text-[#22c55e]' },
                  { label: 'Pending',  count: pending.length,  color: 'text-[#eab308]' },
                  { label: 'Rejected', count: rejected.length, color: 'text-[#f87171]' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white/90">{label}</span>
                    <span className={`font-semibold ${color}`}>{count}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-sm">
                  <span className="font-medium text-white/90">Total</span>
                  <span className="font-semibold text-[#e8f4ff]">{campaign.applications.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(['accepted', 'pending', 'rejected'] as const).map((status) => {
          const group = status === 'accepted' ? accepted : status === 'pending' ? pending : rejected
          if (group.length === 0) return null

          return (
            <div key={status}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${APP_STATUS_STYLE[status]}`}>
                  {status}
                </span>
                <span className="text-sm font-medium text-white/90">{group.length} application{group.length === 1 ? '' : 's'}</span>
              </div>
              <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/25">
                        <th className="px-4 py-3 text-left text-nx-11 font-bold uppercase tracking-[0.15em] text-white/90">Creator</th>
                        <th className="px-4 py-3 text-left text-nx-11 font-bold uppercase tracking-[0.15em] text-white/90">Platforms</th>
                        <th className="px-4 py-3 text-left text-nx-11 font-bold uppercase tracking-[0.15em] text-white/90">Followers</th>
                        <th className="px-4 py-3 text-left text-nx-11 font-bold uppercase tracking-[0.15em] text-white/90">Location</th>
                        <th className="px-4 py-3 text-left text-nx-11 font-bold uppercase tracking-[0.15em] text-white/90">Message</th>
                        <th className="px-4 py-3 text-left text-nx-11 font-bold uppercase tracking-[0.15em] text-white/90">Applied</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {group.map((app, i) => {
                        const c = app.creator
                        const handle = c.twitch_username ?? c.youtube_handle
                        const followers = Math.max(c.subs_followers ?? 0, c.youtube_subscribers ?? 0) || null

                        return (
                          <tr
                            key={app.id}
                            className={`border-b border-white/5 transition-colors hover:bg-white/[0.02] ${
                              i === group.length - 1 ? 'border-b-0' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#e8f4ff]">
                                {handle ?? <span className="italic font-medium text-white/80">No handle</span>}
                              </p>
                              <p className="text-xs font-medium text-white/90">{c.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {c.platform.length > 0
                                  ? c.platform.map((p) => (
                                      <span key={p} className="rounded bg-[#00c8ff]/10 px-1.5 py-0.5 text-xs text-[#00c8ff]">{p}</span>
                                    ))
                                  : <span className="text-xs font-medium text-white/75">—</span>
                                }
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium tabular-nums text-white/90">
                              {followers != null ? followers.toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 font-medium text-white/90">{c.location ?? '—'}</td>
                            <td className="max-w-[220px] px-4 py-3 font-medium text-white/90">
                              {app.message
                                ? <span className="line-clamp-2 text-xs">{app.message}</span>
                                : <span className="text-xs italic text-white/70">No message</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-xs font-medium tabular-nums text-white/90">
                              {app.submitted_at
                                ? new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/admin/users/creators/${c.id}`} className="whitespace-nowrap text-xs font-semibold text-[#99f7ff] hover:text-[#bffcff] hover:underline">
                                View profile
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
