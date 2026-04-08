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
    <div>
      <p className="text-[11px] dash-text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm dash-text-bright">{value ?? '—'}</p>
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/campaigns" className="text-sm dash-text-muted hover:dash-text-bright transition-colors">
          ← Campaigns
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header */}
          <div className="dash-panel p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {campaign.platform.map(p => (
                    <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/20">{p}</span>
                  ))}
                  {campaign.content_type.map(t => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">{t}</span>
                  ))}
                </div>
                <h1 className="text-xl font-bold dash-text-bright">{campaign.title}</h1>
                {campaign.description && (
                  <p className="text-sm dash-text-muted mt-2 leading-relaxed">{campaign.description}</p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize shrink-0 ${STATUS_STYLE[campaign.status] ?? 'bg-[#eab308]/20 text-[#eab308]'}`}>
                {campaign.status}
              </span>
            </div>

            {campaign.game_category.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                {campaign.game_category.map(g => (
                  <span key={g} className="text-[11px] px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{g}</span>
                ))}
              </div>
            )}
          </div>

          {/* Campaign details */}
          <div className="dash-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold dash-text-bright">Campaign Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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

          {/* Creator requirements */}
          {(campaign.min_subs_followers || campaign.min_avg_viewers || campaign.min_engagement_rate ||
            campaign.creator_types.length > 0 || campaign.creator_sizes.length > 0) && (
            <div className="dash-panel p-5 space-y-3">
              <h2 className="text-sm font-semibold dash-text-bright">Creator Requirements</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                <div>
                  <p className="text-[11px] dash-text-muted uppercase tracking-wide mb-1.5">Creator types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.creator_types.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/5 dash-text-muted capitalize">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {campaign.creator_sizes.length > 0 && (
                <div>
                  <p className="text-[11px] dash-text-muted uppercase tracking-wide mb-1.5">Creator sizes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.creator_sizes.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded bg-white/5 dash-text-muted capitalize">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {campaign.required_audience_locations.length > 0 && (
                <div>
                  <p className="text-[11px] dash-text-muted uppercase tracking-wide mb-1.5">Required audience locations</p>
                  <p className="text-sm dash-text-bright">{campaign.required_audience_locations.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Deliverables */}
          {hasDeliverables && (
            <div className="dash-panel p-5 space-y-3">
              <h2 className="text-sm font-semibold dash-text-bright">Content Deliverables</h2>
              <div className="flex gap-4">
                {campaign.num_videos != null && campaign.num_videos > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold dash-text-bright">{campaign.num_videos}</p>
                    <p className="text-[11px] dash-text-muted">Video{campaign.num_videos !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {campaign.num_streams != null && campaign.num_streams > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold dash-text-bright">{campaign.num_streams}</p>
                    <p className="text-[11px] dash-text-muted">Stream{campaign.num_streams !== 1 ? 's' : ''}</p>
                    {campaign.min_stream_duration && (
                      <p className="text-[10px] dash-text-muted">{campaign.min_stream_duration}h min</p>
                    )}
                  </div>
                )}
                {campaign.num_posts != null && campaign.num_posts > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold dash-text-bright">{campaign.num_posts}</p>
                    <p className="text-[11px] dash-text-muted">Post{campaign.num_posts !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {campaign.num_short_videos != null && campaign.num_short_videos > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold dash-text-bright">{campaign.num_short_videos}</p>
                    <p className="text-[11px] dash-text-muted">Short{campaign.num_short_videos !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
              {campaign.content_guidelines && (
                <p className="text-xs dash-text-muted leading-relaxed pt-2 border-t border-white/5">
                  {campaign.content_guidelines}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Sponsor panel */}
          <div className="dash-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold dash-text-muted uppercase tracking-wide">Sponsor</h2>
              <Link href={`/admin/users/sponsors/${campaign.sponsor.id}`} className="text-xs text-[#00c8ff] hover:underline">
                View profile →
              </Link>
            </div>
            <div>
              <p className="dash-text-bright font-semibold">{campaign.sponsor.company_name ?? 'Unnamed'}</p>
              <p className="text-xs dash-text-muted mt-0.5">{campaign.sponsor.email}</p>
            </div>
            {campaign.sponsor.location && (
              <p className="text-xs dash-text-muted">{campaign.sponsor.location}</p>
            )}
            {campaign.sponsor.budget_min != null && campaign.sponsor.budget_max != null && (
              <div>
                <p className="text-[11px] dash-text-muted uppercase tracking-wide mb-0.5">Budget range</p>
                <p className="text-sm dash-text-bright">
                  ${campaign.sponsor.budget_min.toLocaleString()} – ${campaign.sponsor.budget_max.toLocaleString()}
                </p>
              </div>
            )}
            {campaign.sponsor.platform?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {campaign.sponsor.platform.map(p => (
                  <span key={p} className="text-[11px] px-1.5 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{p}</span>
                ))}
              </div>
            )}
          </div>

          {/* Application summary */}
          <div className="dash-panel p-4">
            <h2 className="text-xs font-semibold dash-text-muted uppercase tracking-wide mb-3">Applications</h2>
            <div className="space-y-2">
              {[
                { label: 'Accepted', count: accepted.length, color: 'text-[#22c55e]' },
                { label: 'Pending',  count: pending.length,  color: 'text-[#eab308]' },
                { label: 'Rejected', count: rejected.length, color: 'text-[#f87171]' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="dash-text-muted">{label}</span>
                  <span className={`font-semibold ${color}`}>{count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                <span className="dash-text-muted">Total</span>
                <span className="dash-text-bright font-semibold">{campaign.applications.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Applications ── */}
      {(['accepted', 'pending', 'rejected'] as const).map(status => {
        const group = status === 'accepted' ? accepted : status === 'pending' ? pending : rejected
        if (group.length === 0) return null
        const headingColor = status === 'accepted' ? 'text-[#22c55e]' : status === 'pending' ? 'text-[#eab308]' : 'text-[#f87171]'

        return (
          <div key={status}>
            <h2 className={`text-base font-semibold capitalize mb-3 ${headingColor}`}>
              {status} <span className="dash-text-muted font-normal text-sm">({group.length})</span>
            </h2>
            <div className="dash-panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Creator</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Platforms</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Followers</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Location</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Message</th>
                    <th className="text-left px-4 py-3 dash-text-muted font-medium">Applied</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {group.map((app, i) => {
                    const c = app.creator
                    const handle = c.twitch_username ?? c.youtube_handle
                    const followers = Math.max(c.subs_followers ?? 0, c.youtube_subscribers ?? 0) || null
                    return (
                      <tr
                        key={app.id}
                        className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                          i === group.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="dash-text-bright font-medium">{handle ?? <span className="dash-text-muted italic">No handle</span>}</p>
                          <p className="text-xs dash-text-muted">{c.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.platform.length > 0
                              ? c.platform.map(p => (
                                  <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-[#7b4fff]/10 text-[#7b4fff]">{p}</span>
                                ))
                              : <span className="text-xs dash-text-muted">—</span>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 dash-text-muted">
                          {followers != null ? followers.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 dash-text-muted">{c.location ?? '—'}</td>
                        <td className="px-4 py-3 dash-text-muted max-w-[200px]">
                          {app.message
                            ? <span className="line-clamp-2 text-xs">{app.message}</span>
                            : <span className="italic text-xs">No message</span>
                          }
                        </td>
                        <td className="px-4 py-3 dash-text-muted text-xs">
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/users/creators/${c.id}`} className="text-xs text-[#00c8ff] hover:underline whitespace-nowrap">
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
        )
      })}
    </div>
  )
}
