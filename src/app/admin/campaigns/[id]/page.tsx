import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Campaign Detail — nx8up Admin' }

const STATUS_STYLE: Record<string, string> = {
  live:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  draft:
    'rounded-full border border-slate-400/35 bg-slate-500/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-200',
  cancelled:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
}

const APP_STATUS_STYLE: Record<string, string> = {
  accepted:
    'rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#86efac]',
  pending:
    'rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fde047]',
  rejected:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fca5a5]',
}

function StatCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="sp-app-stat-panel rounded-lg p-3">
      <p className="sp-app-stat-label">{label}</p>
      <p className="sp-app-stat-value mt-1">{value ?? '—'}</p>
    </div>
  )
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="sp-app-stat-label">{label}</span>
      <span className="sp-app-stat-value">{children}</span>
    </div>
  )
}

type Props = { params: Promise<{ id: string }> }

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
  const pending = campaign.applications.filter(a => a.status === 'pending')
  const rejected = campaign.applications.filter(a => a.status === 'rejected')

  const hasDeliverables =
    campaign.num_videos || campaign.num_streams || campaign.num_posts || campaign.num_short_videos

  const budgetDisplay =
    campaign.budget != null ? `$${campaign.budget.toLocaleString()}` : '—'

  return (
    <div className="admin-campaigns admin-campaigns-detail mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      <Link
        href="/admin/campaigns"
        className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
      >
        <span aria-hidden>&larr;</span>
        Back to Campaigns
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="cr-field-label">Campaign</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="mt-2 text-sm leading-relaxed cr-text-muted line-clamp-3">
              {campaign.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {campaign.platform.map(p => (
              <span
                key={p}
                className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]"
              >
                {p}
              </span>
            ))}
            {campaign.content_type.map(t => (
              <span
                key={t}
                className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <span
            className={`${STATUS_STYLE[campaign.status] ?? 'rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#fde047]'}`}
          >
            {campaign.status}
          </span>
          <div className="sp-app-header-stat rounded-lg px-4 py-2.5 text-center">
            <p className="font-headline text-2xl font-semibold tabular-nums text-[#99f7ff]">
              {budgetDisplay}
            </p>
            <p className="sp-app-stat-label mt-0.5">Budget</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {campaign.game_category.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {campaign.game_category.map(g => (
                <span
                  key={g}
                  className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-xs text-[#d8b4fe]"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5">
            <h2 className="cr-panel-title mb-4">Campaign details</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <StatCell label="Budget" value={budgetDisplay} />
              <StatCell label="Payment model" value={campaign.payment_model} />
              <StatCell label="Campaign type" value={campaign.campaign_type} />
              <StatCell label="Brand" value={campaign.brand_name} />
              <StatCell label="Product" value={campaign.product_name} />
              <StatCell label="Product type" value={campaign.product_type} />
              <StatCell label="Objective" value={campaign.objective} />
              <StatCell label="Spots" value={campaign.creator_count} />
              <StatCell label="Applicants" value={campaign.applications.length} />
              {campaign.start_date && (
                <StatCell
                  label="Start date"
                  value={new Date(campaign.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              )}
              {campaign.end_date && (
                <StatCell
                  label="End date"
                  value={new Date(campaign.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                />
              )}
            </div>
          </section>

          {(campaign.min_subs_followers ||
            campaign.min_avg_viewers ||
            campaign.min_engagement_rate ||
            campaign.creator_types.length > 0 ||
            campaign.creator_sizes.length > 0) && (
            <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5">
              <h2 className="cr-panel-title mb-4">Creator requirements</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {campaign.min_subs_followers != null && (
                  <StatCell
                    label="Min followers"
                    value={campaign.min_subs_followers.toLocaleString()}
                  />
                )}
                {campaign.min_avg_viewers != null && (
                  <StatCell
                    label="Min avg viewers"
                    value={campaign.min_avg_viewers.toLocaleString()}
                  />
                )}
                {campaign.min_engagement_rate != null && (
                  <StatCell
                    label="Min CTR"
                    value={`${Number(campaign.min_engagement_rate).toFixed(1)}%`}
                  />
                )}
                {(campaign.min_audience_age != null || campaign.max_audience_age != null) && (
                  <StatCell
                    label="Audience age"
                    value={`${campaign.min_audience_age ?? '?'}–${campaign.max_audience_age ?? '?'}`}
                  />
                )}
              </div>
              {campaign.creator_types.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="sp-app-stat-label mb-1.5">Creator types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.creator_types.map(t => (
                      <span
                        key={t}
                        className="rounded border border-white/12 bg-white/5 px-2 py-0.5 text-xs capitalize cr-text"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {campaign.creator_sizes.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="sp-app-stat-label mb-1.5">Creator sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.creator_sizes.map(s => (
                      <span
                        key={s}
                        className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs capitalize text-[#99f7ff]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {campaign.required_audience_locations.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="sp-app-stat-label mb-1.5">Required audience locations</p>
                  <p className="text-sm cr-text">{campaign.required_audience_locations.join(', ')}</p>
                </div>
              )}
            </section>
          )}

          {hasDeliverables && (
            <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5">
              <h2 className="cr-panel-title mb-4">Content deliverables</h2>
              <div className="flex flex-wrap gap-3">
                {campaign.num_videos != null && campaign.num_videos > 0 && (
                  <div className="sp-app-stat-panel min-w-[88px] rounded-lg px-4 py-3 text-center">
                    <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                      {campaign.num_videos}
                    </p>
                    <p className="sp-app-stat-label mt-0.5">
                      Video{campaign.num_videos !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {campaign.num_streams != null && campaign.num_streams > 0 && (
                  <div className="sp-app-stat-panel min-w-[88px] rounded-lg px-4 py-3 text-center">
                    <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                      {campaign.num_streams}
                    </p>
                    <p className="sp-app-stat-label mt-0.5">
                      Stream{campaign.num_streams !== 1 ? 's' : ''}
                    </p>
                    {campaign.min_stream_duration && (
                      <p className="mt-0.5 text-nx-10 cr-stat-caption">
                        {campaign.min_stream_duration}h min
                      </p>
                    )}
                  </div>
                )}
                {campaign.num_posts != null && campaign.num_posts > 0 && (
                  <div className="sp-app-stat-panel min-w-[88px] rounded-lg px-4 py-3 text-center">
                    <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                      {campaign.num_posts}
                    </p>
                    <p className="sp-app-stat-label mt-0.5">
                      Post{campaign.num_posts !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                {campaign.num_short_videos != null && campaign.num_short_videos > 0 && (
                  <div className="sp-app-stat-panel min-w-[88px] rounded-lg px-4 py-3 text-center">
                    <p className="font-headline text-2xl font-semibold tabular-nums text-[#e8f4ff]">
                      {campaign.num_short_videos}
                    </p>
                    <p className="sp-app-stat-label mt-0.5">
                      Short{campaign.num_short_videos !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
              {campaign.content_guidelines && (
                <p className="mt-4 border-t border-white/10 pt-3 text-sm leading-relaxed cr-text-muted">
                  {campaign.content_guidelines}
                </p>
              )}
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="sp-app-stat-panel rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <h3 className="cr-panel-title">Sponsor</h3>
              <Link
                href={`/admin/users/sponsors/${campaign.sponsor.id}`}
                className="text-xs font-semibold text-[#bffcff] hover:text-[#99f7ff]"
              >
                View profile →
              </Link>
            </div>
            <p className="font-semibold text-[#e8f4ff]">{campaign.sponsor.company_name ?? 'Unnamed'}</p>
            <p className="mt-0.5 text-sm cr-text-muted">{campaign.sponsor.email}</p>
            {campaign.sponsor.location && (
              <p className="mt-2 text-sm cr-stat-caption">{campaign.sponsor.location}</p>
            )}
            {campaign.sponsor.budget_min != null && campaign.sponsor.budget_max != null && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="sp-app-stat-label mb-1">Budget range</p>
                <p className="sp-app-stat-value">
                  ${campaign.sponsor.budget_min.toLocaleString()} – $
                  {campaign.sponsor.budget_max.toLocaleString()}
                </p>
              </div>
            )}
            {campaign.sponsor.platform?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {campaign.sponsor.platform.map(p => (
                  <span
                    key={p}
                    className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-1.5 py-0.5 text-nx-11 text-[#99f7ff]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="sp-app-stat-panel rounded-xl p-4">
            <h3 className="cr-panel-title mb-3">Applications</h3>
            <div className="space-y-2">
              <SideRow label="Accepted">
                <span className="font-semibold text-[#86efac]">{accepted.length}</span>
              </SideRow>
              <SideRow label="Pending">
                <span className="font-semibold text-[#fde047]">{pending.length}</span>
              </SideRow>
              <SideRow label="Rejected">
                <span className="font-semibold text-[#fca5a5]">{rejected.length}</span>
              </SideRow>
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm">
                <span className="sp-app-stat-label">Total</span>
                <span className="sp-app-stat-value font-semibold">{campaign.applications.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(['accepted', 'pending', 'rejected'] as const).map(status => {
        const group = status === 'accepted' ? accepted : status === 'pending' ? pending : rejected
        if (group.length === 0) return null

        return (
          <section key={status}>
            <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
              <span className={APP_STATUS_STYLE[status]}>{status}</span>
              <span className="text-sm cr-stat-caption">
                {group.length} application{group.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="dash-panel dash-panel--nx-top overflow-hidden rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20">
              <div className="overflow-x-auto">
                <table className="sp-ledger-table w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left">Creator</th>
                      <th className="px-4 py-3 text-left">Platforms</th>
                      <th className="px-4 py-3 text-left">Followers</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Message</th>
                      <th className="px-4 py-3 text-left">Applied</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((app, i) => {
                      const c = app.creator
                      const handle = c.twitch_username ?? c.youtube_handle
                      const followers =
                        Math.max(c.subs_followers ?? 0, c.youtube_subscribers ?? 0) || null

                      return (
                        <tr
                          key={app.id}
                          className={`border-b border-white/5 ${
                            i === group.length - 1 ? 'border-b-0' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#e8f4ff]">
                              {handle ?? (
                                <span className="italic cr-stat-caption">No handle</span>
                              )}
                            </p>
                            <p className="text-xs cr-stat-caption">{c.email}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {c.platform.length > 0 ? (
                                c.platform.map(p => (
                                  <span
                                    key={p}
                                    className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-1.5 py-0.5 text-xs text-[#99f7ff]"
                                  >
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="cr-stat-caption">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 tabular-nums cr-text">
                            {followers != null ? followers.toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 cr-stat-caption">{c.location ?? '—'}</td>
                          <td className="max-w-[220px] px-4 py-3 cr-stat-caption">
                            {app.message ? (
                              <span className="line-clamp-2 text-xs" title={app.message}>
                                {app.message}
                              </span>
                            ) : (
                              <span className="text-xs italic opacity-60">No message</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs tabular-nums cr-stat-caption">
                            {app.submitted_at
                              ? new Date(app.submitted_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/users/creators/${c.id}`}
                              className="whitespace-nowrap text-xs font-semibold text-[#bffcff] hover:text-[#99f7ff]"
                            >
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
          </section>
        )
      })}
    </div>
  )
}
