import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCampaignById, getMyApplication } from '../_actions'
import ApplyButton from './ApplyButton'
import { prisma } from '@/lib/prisma'
import { matchCreatorToCampaign } from '@/lib/matching'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()

  const [campaign, myApplication, creatorProfile] = await Promise.all([
    getCampaignById(id),
    getMyApplication(id),
    userId
      ? prisma.content_creators.findUnique({
          where: { clerk_user_id: userId },
          select: {
            location: true,
            platform: true,
            subs_followers: true,
            youtube_subscribers: true,
            average_vod_views: true,
            youtube_avg_views: true,
            engagement_rate: true,
            audience_age_min: true,
            audience_age_max: true,
            audience_locations: true,
            audience_gender: true,
            audience_interests: true,
            creator_types: true,
            creator_size: true,
            game_category: true,
            content_type: true,
            preferred_campaign_types: true,
            preferred_product_types: true,
            is_available: true,
          },
        })
      : null,
  ])

  if (!campaign) notFound()

  const { eligible, score, reasons, notes } = creatorProfile
    ? matchCreatorToCampaign(creatorProfile, campaign)
    : { eligible: true, score: 100, reasons: [] as string[], notes: [] as string[] }

  const alreadyApplied = myApplication != null

  const hasRequirements =
    campaign.min_avg_viewers ||
    campaign.min_subs_followers ||
    campaign.min_engagement_rate ||
    campaign.min_audience_age ||
    campaign.max_audience_age ||
    campaign.required_audience_locations.length > 0

  const hasDeliverables =
    campaign.num_videos ||
    campaign.num_streams ||
    campaign.num_posts ||
    campaign.num_short_videos

  const hasBrief =
    campaign.objective ||
    campaign.brand_name ||
    campaign.product_name ||
    campaign.product_type ||
    campaign.payment_model ||
    campaign.campaign_type

  const hasContentReqs =
    campaign.content_guidelines ||
    campaign.must_include_link ||
    campaign.must_include_promo_code ||
    campaign.must_tag_brand ||
    campaign.conversion_goal ||
    campaign.tracking_type

  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      {/* Back link */}
      <Link
        href="/creator/campaigns"
        className="inline-flex items-center gap-1.5 text-xs cr-text-muted hover:text-[#c8dff0] transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Campaigns
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header card */}
          <div className="cr-panel p-5 sm:p-6">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {campaign.platform.map((p: string) => (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-medium border border-[#22c55e]/20">
                  {p}
                </span>
              ))}
              {campaign.content_type.map((t: string) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] font-medium border border-[#a855f7]/20">
                  {t}
                </span>
              ))}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold cr-text-bright mb-1">{campaign.title}</h1>
            <p className="text-sm cr-text-muted mb-4">
              by <span className="cr-text">{campaign.sponsor.company_name ?? 'Sponsor'}</span>
            </p>

            {campaign.description && (
              <p className="text-sm cr-text leading-relaxed">{campaign.description}</p>
            )}

            {campaign.game_category.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t cr-border">
                {campaign.game_category.map((g: string) => (
                  <span key={g} className="text-[11px] px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Campaign Brief */}
          {hasBrief && (
            <div className="cr-panel p-5">
              <h2 className="cr-panel-title mb-4">Campaign Brief</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {campaign.objective && (
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] cr-text-muted uppercase tracking-wide mb-0.5">Objective</dt>
                    <dd className="text-sm cr-text">{campaign.objective}</dd>
                  </div>
                )}
                {campaign.brand_name && (
                  <div>
                    <dt className="text-[11px] cr-text-muted uppercase tracking-wide mb-0.5">Brand</dt>
                    <dd className="text-sm cr-text-bright font-medium">{campaign.brand_name}</dd>
                  </div>
                )}
                {campaign.product_name && (
                  <div>
                    <dt className="text-[11px] cr-text-muted uppercase tracking-wide mb-0.5">Product</dt>
                    <dd className="text-sm cr-text-bright font-medium">{campaign.product_name}</dd>
                  </div>
                )}
                {campaign.product_type && (
                  <div>
                    <dt className="text-[11px] cr-text-muted uppercase tracking-wide mb-0.5">Product Type</dt>
                    <dd className="text-sm cr-text capitalize">{campaign.product_type}</dd>
                  </div>
                )}
                {campaign.campaign_type && (
                  <div>
                    <dt className="text-[11px] cr-text-muted uppercase tracking-wide mb-0.5">Campaign Type</dt>
                    <dd className="text-sm cr-text capitalize">{campaign.campaign_type}</dd>
                  </div>
                )}
                {campaign.payment_model && (
                  <div>
                    <dt className="text-[11px] cr-text-muted uppercase tracking-wide mb-0.5">Payment Model</dt>
                    <dd className="text-sm cr-text-bright font-medium uppercase">{campaign.payment_model}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Content Deliverables */}
          {hasDeliverables && (
            <div className="cr-panel p-5">
              <h2 className="cr-panel-title mb-4">Content Deliverables</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {campaign.num_videos != null && campaign.num_videos > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_videos}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Video{campaign.num_videos !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {campaign.num_streams != null && campaign.num_streams > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_streams}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Stream{campaign.num_streams !== 1 ? 's' : ''}</p>
                    {campaign.min_stream_duration != null && (
                      <p className="text-[10px] text-[#3a5570] mt-0.5">{campaign.min_stream_duration}h min</p>
                    )}
                  </div>
                )}
                {campaign.num_posts != null && campaign.num_posts > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_posts}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Post{campaign.num_posts !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {campaign.num_short_videos != null && campaign.num_short_videos > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_short_videos}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Short{campaign.num_short_videos !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
              {campaign.video_includes.length > 0 && (
                <div className="mt-4 pt-4 border-t cr-border">
                  <p className="text-[11px] cr-text-muted uppercase tracking-wide mb-2">Video must include</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.video_includes.map((v: string) => (
                      <span key={v} className="text-xs px-2 py-0.5 rounded bg-white/5 cr-text border border-white/5">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Requirements */}
          {hasContentReqs && (
            <div className="cr-panel p-5">
              <h2 className="cr-panel-title mb-4">Content Requirements</h2>
              {campaign.content_guidelines && (
                <p className="text-sm cr-text leading-relaxed mb-4">{campaign.content_guidelines}</p>
              )}
              <div className="space-y-2">
                {campaign.must_include_link && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#00c8ff] text-sm">✓</span>
                    <span className="text-sm cr-text">Must include tracking link</span>
                    {campaign.landing_page_url && (
                      <span className="text-xs cr-text-muted truncate">({campaign.landing_page_url})</span>
                    )}
                  </div>
                )}
                {campaign.must_include_promo_code && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#00c8ff] text-sm">✓</span>
                    <span className="text-sm cr-text">Must include promo code</span>
                  </div>
                )}
                {campaign.must_tag_brand && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#00c8ff] text-sm">✓</span>
                    <span className="text-sm cr-text">Must tag brand</span>
                  </div>
                )}
                {campaign.conversion_goal && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] cr-text-muted uppercase tracking-wide w-28 shrink-0">Conversion goal</span>
                    <span className="text-sm cr-text capitalize">{campaign.conversion_goal}</span>
                  </div>
                )}
                {campaign.tracking_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] cr-text-muted uppercase tracking-wide w-28 shrink-0">Tracking</span>
                    <span className="text-sm cr-text capitalize">{campaign.tracking_type}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requirements */}
          {hasRequirements && (
            <div className="cr-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="cr-panel-title mb-0">Creator Requirements</h2>
                {creatorProfile && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#3a5570]">Your match</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                      score >= 75
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                        : score >= 45
                          ? 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {score}%
                    </span>
                    {!eligible && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                        Ineligible
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {campaign.min_avg_viewers != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{campaign.min_avg_viewers.toLocaleString()}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Min. avg viewers</p>
                  </div>
                )}
                {campaign.min_subs_followers != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{campaign.min_subs_followers.toLocaleString()}</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Min. followers / subs</p>
                  </div>
                )}
                {campaign.min_engagement_rate != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{Number(campaign.min_engagement_rate).toFixed(1)}%</p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Min. engagement rate</p>
                  </div>
                )}
                {(campaign.min_audience_age != null || campaign.max_audience_age != null) && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">
                      {campaign.min_audience_age ?? '?'}–{campaign.max_audience_age ?? '?'}
                    </p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Target audience age</p>
                  </div>
                )}
                {campaign.required_audience_locations.length > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center sm:col-span-2">
                    <p className="text-sm font-semibold cr-text-bright leading-snug">
                      {campaign.required_audience_locations.join(', ')}
                    </p>
                    <p className="text-[11px] cr-text-muted mt-0.5">Required audience locations</p>
                  </div>
                )}
              </div>
              {!eligible && reasons.length > 0 && (
                <div className="mt-3 pt-3 border-t cr-border">
                  <p className="text-xs text-red-400/80 font-medium mb-1">Requirements not met:</p>
                  <ul className="space-y-0.5">
                    {reasons.map((r) => (
                      <li key={r} className="text-xs text-red-400/70">· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {notes.length > 0 && (
                <div className="mt-3 pt-3 border-t cr-border">
                  <p className="text-xs cr-text-muted font-medium mb-1">Soft mismatches:</p>
                  <ul className="space-y-0.5">
                    {notes.map((n) => (
                      <li key={n} className="text-xs cr-text-muted opacity-70">· {n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <div className="cr-panel p-5">
            {campaign.budget != null && (
              <div className="mb-4 pb-4 border-b cr-border text-center">
                <p className="text-3xl font-bold cr-success">${campaign.budget.toLocaleString()}</p>
                <p className="text-xs cr-text-muted mt-1">Campaign Budget</p>
              </div>
            )}

            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center">
                <span className="cr-text-muted">Status</span>
                <span className="capitalize text-[#22c55e] font-medium text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
                  {campaign.status}
                </span>
              </li>
              {campaign.start_date && (
                <li className="flex justify-between items-center">
                  <span className="cr-text-muted">Starts</span>
                  <span className="cr-text-bright font-medium text-xs">
                    {new Date(campaign.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </li>
              )}
              {campaign.end_date && (
                <li className="flex justify-between items-center">
                  <span className="cr-text-muted">Ends</span>
                  <span className="cr-text-bright font-medium text-xs">
                    {new Date(campaign.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </li>
              )}
              <li className="flex justify-between items-center">
                <span className="cr-text-muted">Applicants</span>
                <span className="cr-text-bright font-medium text-xs">{campaign._count.applications}</span>
              </li>
              {campaign.creator_count != null && (
                <li className="flex justify-between items-center">
                  <span className="cr-text-muted">Spots available</span>
                  <span className="cr-text-bright font-medium text-xs">{campaign.creator_count}</span>
                </li>
              )}
              {campaign.target_cities && (
                <li className="flex justify-between items-start gap-3">
                  <span className="cr-text-muted shrink-0">Target cities</span>
                  <span className="cr-text text-xs text-right">{campaign.target_cities}</span>
                </li>
              )}
              {campaign.creator_types.length > 0 && (
                <li className="flex justify-between items-start gap-3">
                  <span className="cr-text-muted shrink-0">Creator types</span>
                  <span className="cr-text text-xs text-right capitalize">{campaign.creator_types.join(', ')}</span>
                </li>
              )}
              {campaign.creator_sizes.length > 0 && (
                <li className="flex justify-between items-start gap-3">
                  <span className="cr-text-muted shrink-0">Creator size</span>
                  <span className="cr-text text-xs text-right capitalize">{campaign.creator_sizes.join(', ')}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Full-width Apply panel ── */}
      <div className="cr-panel px-6 py-4">
        {campaign.status === 'launched' ? (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#a855f7] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#a855f7]">Campaign Launched</p>
              {alreadyApplied ? (
                <p className="text-xs cr-text-muted">
                  Your application status: <span className="capitalize cr-text">{myApplication!.status}</span>
                </p>
              ) : (
                <p className="text-xs cr-text-muted">This campaign is no longer accepting applications.</p>
              )}
            </div>
          </div>
        ) : alreadyApplied ? (
          <div className="flex items-center gap-3">
            <span className="text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-[#22c55e]">Application Submitted</p>
              <p className="text-xs cr-text-muted">Status: <span className="capitalize cr-text">{myApplication!.status}</span></p>
            </div>
          </div>
        ) : (
          <ApplyButton
            campaignId={campaign.id}
            profileLocation={creatorProfile?.location ?? null}
            profileAudienceAgeMin={creatorProfile?.audience_age_min ?? null}
            profileAudienceAgeMax={creatorProfile?.audience_age_max ?? null}
            profileAudienceLocations={creatorProfile?.audience_locations ?? []}
            acceptedMediaTypes={campaign.content_type}
            eligible={eligible}
            ineligibleReasons={reasons}
          />
        )}
      </div>
    </main>
  )
}
