/**
 * Campaign detail page (`/creator/campaigns/[id]`).
 *
 * Server component that renders the full campaign brief for an individual
 * campaign, including:
 *  - Header card: title, sponsor, description, platform/content tags.
 *  - Campaign brief: objective, brand, product, payment model.
 *  - Content deliverables: video/stream/post/clip counts.
 *  - Content requirements: guidelines, must-include-link, promo code, etc.
 *  - Creator requirements: min followers/views/CTR, audience age/location.
 *    If the creator's profile is loaded, shows their match score and
 *    ineligibility reasons.
 *  - Budget sidebar: creator pool breakdown (budget minus nx8up fee).
 *  - Apply panel: conditionally renders ApplyButton, InviteResponseButtons,
 *    or a "already applied / launched" status message.
 *
 * Calls `notFound()` when:
 *  - The campaign does not exist.
 *  - The campaign has a legal age restriction the creator's audience violates
 *    (effectively hides the page rather than showing an error message).
 *
 * External services: Prisma/PostgreSQL (via server actions and direct query),
 * Clerk (auth).
 *
 * Gotcha: the legal age restriction `notFound()` path silently hides the page
 * from ineligible creators with no explanation. This may confuse creators
 * who reach the page via a direct URL.
 */
import { notFound } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCampaignById, getMyApplication } from '../_actions'
import ApplyButton from './ApplyButton'
import InviteResponseButtons from '@/components/creator/InviteResponseButtons'
import { prisma } from '@/lib/prisma'
import { matchCreatorToCampaign } from '@/lib/matching'
import Image from 'next/image'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorShell from '@/components/creator/CreatorShell'
import NxHudCard from '@/components/nx-shell/NxHudCard'
import { getClerkImageUrls } from '@/lib/get-clerk-images'
import { calcFeeBreakdown } from '@/lib/constants'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('creator.campaigns')
  const format = await getFormatter()
  const [{ userId, sessionClaims }, { displayName, username }] = await Promise.all([auth(), getUserDisplayInfo()])
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

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
            audience_regions: true,
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

  const sponsorClerkId = campaign.sponsor.clerk_user_id
  const sponsorImages = await getClerkImageUrls(sponsorClerkId ? [sponsorClerkId] : [])
  const sponsorImageUrl = sponsorClerkId ? sponsorImages[sponsorClerkId] : undefined

  if (campaign.legal_age_restriction && creatorProfile?.audience_age_min != null) {
    const restrictionAge = campaign.legal_age_restriction === '21+' ? 21 : 18
    if (creatorProfile.audience_age_min < restrictionAge) notFound()
  }

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
    campaign.num_youtube_shorts ||
    campaign.num_streams ||
    campaign.num_twitch_clips ||
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
    <CreatorShell>
    <main className="creator-campaigns creator-campaign-detail max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      {/* Back link */}
      <Link
        href="/creator/campaigns"
        className="inline-flex items-center gap-1.5 text-sm cr-text-muted hover:text-[#99f7ff] transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('back')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Header card */}
          <NxHudCard as="div" className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {campaign.platform.map((p: string) => (
                <span key={p} className="text-nx-11 px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] font-medium border border-[#22c55e]/20">
                  {p}
                </span>
              ))}
              {campaign.content_type.map((ct: string) => (
                <span key={ct} className="text-nx-11 px-2 py-0.5 rounded-full bg-[#a855f7]/10 text-[#a855f7] font-medium border border-[#a855f7]/20">
                  {ct}
                </span>
              ))}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold cr-text-bright mb-1">{campaign.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              {sponsorImageUrl && (
                <Image
                  src={sponsorImageUrl}
                  alt={campaign.sponsor.company_name ?? 'Sponsor'}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  unoptimized
                />
              )}
              <p className="text-sm text-[#d6dce6]">
                {t('by')} <span className="cr-text-bright font-medium">{campaign.sponsor.company_name ?? 'Sponsor'}</span>
              </p>
            </div>

            {campaign.description && (
              <p className="text-sm cr-text leading-relaxed">{campaign.description}</p>
            )}

            {campaign.game_category.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t cr-border">
                {campaign.game_category.map((g: string) => (
                  <span key={g} className="text-nx-11 px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                    {g}
                  </span>
                ))}
              </div>
            )}
          </NxHudCard>

          {/* Campaign Brief */}
          {hasBrief && (
            <NxHudCard as="div" className="p-5">
              <h2 className="cr-panel-title mb-4">{t('brief')}</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {campaign.objective && (
                  <div className="sm:col-span-2">
                    <dt className="cr-field-label mb-1">{t('objective')}</dt>
                    <dd className="text-sm cr-text">{campaign.objective}</dd>
                  </div>
                )}
                {campaign.brand_name && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('brand')}</dt>
                    <dd className="text-sm cr-text-bright font-medium">{campaign.brand_name}</dd>
                  </div>
                )}
                {campaign.product_name && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('product')}</dt>
                    <dd className="text-sm cr-text-bright font-medium">{campaign.product_name}</dd>
                  </div>
                )}
                {campaign.product_type && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('productType')}</dt>
                    <dd className="text-sm cr-text capitalize">{campaign.product_type}</dd>
                  </div>
                )}
                {campaign.campaign_type && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('campaignType')}</dt>
                    <dd className="text-sm cr-text capitalize">{campaign.campaign_type}</dd>
                  </div>
                )}
                {campaign.payment_model && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('paymentModel')}</dt>
                    <dd className="text-sm cr-text-bright font-medium uppercase">{campaign.payment_model}</dd>
                  </div>
                )}
              </dl>
            </NxHudCard>
          )}

          {/* Content Deliverables */}
          {hasDeliverables && (
            <NxHudCard as="div" className="p-5">
              <h2 className="cr-panel-title mb-4">{t('deliverables')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {campaign.num_videos != null && campaign.num_videos > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_videos}</p>
                    <p className="cr-stat-caption mt-1">{campaign.num_videos === 1 ? t('videoSingular') : t('videoPlural')}</p>
                  </div>
                )}
                {campaign.num_youtube_shorts != null && campaign.num_youtube_shorts > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_youtube_shorts}</p>
                    <p className="cr-stat-caption mt-1">{campaign.num_youtube_shorts === 1 ? t('ytShortSingular') : t('ytShortPlural')}</p>
                  </div>
                )}
                {campaign.num_streams != null && campaign.num_streams > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_streams}</p>
                    <p className="cr-stat-caption mt-1">{campaign.num_streams === 1 ? t('streamSingular') : t('streamPlural')}</p>
                    {campaign.min_stream_duration != null && (
                      <p className="text-nx-10 text-[#c4ccd8] mt-0.5">{campaign.min_stream_duration}h {t('minLabel')}</p>
                    )}
                  </div>
                )}
                {campaign.num_twitch_clips != null && campaign.num_twitch_clips > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_twitch_clips}</p>
                    <p className="cr-stat-caption mt-1">{campaign.num_twitch_clips === 1 ? t('clipSingular') : t('clipPlural')}</p>
                  </div>
                )}
                {campaign.num_posts != null && campaign.num_posts > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_posts}</p>
                    <p className="cr-stat-caption mt-1">{campaign.num_posts === 1 ? t('postSingular') : t('postPlural')}</p>
                  </div>
                )}
                {campaign.num_short_videos != null && campaign.num_short_videos > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-2xl font-bold cr-text-bright">{campaign.num_short_videos}</p>
                    <p className="cr-stat-caption mt-1">{campaign.num_short_videos === 1 ? t('shortLabel') : t('shortPlural')}</p>
                  </div>
                )}
              </div>
              {campaign.video_includes.length > 0 && (
                <div className="mt-4 pt-4 border-t cr-border">
                  <p className="cr-field-label mb-2">{t('videoMustInclude')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.video_includes.map((v: string) => (
                      <span key={v} className="text-xs px-2 py-0.5 rounded bg-white/5 cr-text border border-white/5">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </NxHudCard>
          )}

          {/* Content Requirements */}
          {hasContentReqs && (
            <NxHudCard as="div" className="p-5">
              <h2 className="cr-panel-title mb-4">{t('contentRequirements')}</h2>
              {campaign.content_guidelines && (
                <p className="text-sm cr-text leading-relaxed mb-4">{campaign.content_guidelines}</p>
              )}
              <div className="space-y-2">
                {campaign.must_include_link && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#00c8ff] text-sm">✓</span>
                    <span className="text-sm cr-text">{t('mustIncludeLink')}</span>
                    {campaign.landing_page_url && (
                      <span className="text-xs text-[#c4ccd8] truncate">({campaign.landing_page_url})</span>
                    )}
                  </div>
                )}
                {campaign.must_include_promo_code && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#00c8ff] text-sm">✓</span>
                    <span className="text-sm cr-text">{t('mustIncludeCode')}</span>
                  </div>
                )}
                {campaign.must_tag_brand && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#00c8ff] text-sm">✓</span>
                    <span className="text-sm cr-text">{t('mustTagBrand')}</span>
                  </div>
                )}
                {campaign.conversion_goal && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="cr-field-label w-28 shrink-0">{t('conversionGoal')}</span>
                    <span className="text-sm cr-text capitalize">{campaign.conversion_goal}</span>
                  </div>
                )}
                {campaign.tracking_type && (
                  <div className="flex items-center gap-2">
                    <span className="cr-field-label w-28 shrink-0">{t('tracking')}</span>
                    <span className="text-sm cr-text capitalize">{campaign.tracking_type}</span>
                  </div>
                )}
              </div>
            </NxHudCard>
          )}

          {/* Requirements */}
          {hasRequirements && (
            <NxHudCard as="div" className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="cr-panel-title mb-0">{t('creatorRequirements')}</h2>
                {creatorProfile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm cr-meta-label">{t('yourMatch')}</span>
                    <span className={`text-nx-11 px-2 py-0.5 rounded-full font-medium border ${
                      score >= 75
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                        : score >= 45
                          ? 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {score}%
                    </span>
                    {!eligible && (
                      <span className="text-nx-11 px-2 py-0.5 rounded-full font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                        {t('ineligible')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {campaign.min_avg_viewers != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{format.number(campaign.min_avg_viewers)}</p>
                    <p className="cr-stat-caption mt-1">{t('minAvgViewers')}</p>
                  </div>
                )}
                {campaign.min_subs_followers != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{format.number(campaign.min_subs_followers)}</p>
                    <p className="cr-stat-caption mt-1">{t('minFollowers')}</p>
                  </div>
                )}
                {campaign.min_engagement_rate != null && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">{Number(campaign.min_engagement_rate).toFixed(1)}%</p>
                    <p className="cr-stat-caption mt-1">{t('minCtr')}</p>
                  </div>
                )}
                {(campaign.min_audience_age != null || campaign.max_audience_age != null) && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                    <p className="text-lg font-bold cr-text-bright">
                      {campaign.min_audience_age ?? '?'}–{campaign.max_audience_age ?? '?'}
                    </p>
                    <p className="cr-stat-caption mt-1">{t('targetAgeRange')}</p>
                  </div>
                )}
                {campaign.required_audience_locations.length > 0 && (
                  <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center sm:col-span-2">
                    <p className="text-sm font-semibold cr-text-bright leading-snug">
                      {campaign.required_audience_locations.join(', ')}
                    </p>
                    <p className="cr-stat-caption mt-1">{t('requiredLocations')}</p>
                  </div>
                )}
              </div>
              {!eligible && reasons.length > 0 && (
                <div className="mt-3 pt-3 border-t cr-border">
                  <p className="text-xs text-red-400/80 font-medium mb-1">{t('requirementsNotMet')}</p>
                  <ul className="space-y-0.5">
                    {reasons.map((r) => (
                      <li key={r} className="text-xs text-red-400/70">· {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {notes.length > 0 && (
                <div className="mt-3 pt-3 border-t cr-border">
                  <p className="text-sm cr-meta-label font-medium mb-1">{t('softMismatches')}</p>
                  <ul className="space-y-0.5">
                    {notes.map((n) => (
                      <li key={n} className="text-sm text-[#c4ccd8]">· {n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </NxHudCard>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <NxHudCard as="div" className="p-5">
            {campaign.budget != null && (() => {
              const { perCreator } = calcFeeBreakdown(campaign.budget, campaign.creator_count)
              return perCreator ? (
                <div className="mb-4 pb-4 border-b cr-border">
                  <p className="text-2xl font-bold cr-success">${format.number(perCreator)}</p>
                  <p className="cr-stat-caption mt-0.5">{t('yourPayout')}</p>
                </div>
              ) : null
            })()}
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between items-center">
                <span className="cr-meta-label">{t('status')}</span>
                <span className="capitalize text-[#22c55e] font-medium text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
                  {campaign.status}
                </span>
              </li>
              {campaign.start_date && (
                <li className="flex justify-between items-center">
                  <span className="cr-meta-label">{t('starts')}</span>
                  <span className="cr-text-bright font-medium text-xs">
                    {format.dateTime(new Date(campaign.start_date), 'medium')}
                  </span>
                </li>
              )}
              {campaign.end_date && (
                <li className="flex justify-between items-center">
                  <span className="cr-meta-label">{t('ends')}</span>
                  <span className="cr-text-bright font-medium text-xs">
                    {format.dateTime(new Date(campaign.end_date), 'medium')}
                  </span>
                </li>
              )}
              <li className="flex justify-between items-center">
                <span className="cr-meta-label">{t('applicants')}</span>
                <span className="cr-text-bright font-medium text-xs">{campaign._count.applications}</span>
              </li>
              {campaign.creator_count != null && (
                <li className="flex justify-between items-center">
                  <span className="cr-meta-label">{t('spotsAvailable')}</span>
                  <span className="cr-text-bright font-medium text-xs">
                    {Math.max(0, campaign.creator_count - campaign.acceptedCount)}
                  </span>
                </li>
              )}
              {campaign.target_cities && (
                <li className="flex justify-between items-start gap-3">
                  <span className="cr-meta-label shrink-0">{t('targetCities')}</span>
                  <span className="cr-text-bright text-sm text-right">{campaign.target_cities}</span>
                </li>
              )}
              {campaign.creator_types.length > 0 && (
                <li className="flex justify-between items-start gap-3">
                  <span className="cr-meta-label shrink-0">{t('creatorTypes')}</span>
                  <span className="cr-text-bright text-sm text-right capitalize">{campaign.creator_types.join(', ')}</span>
                </li>
              )}
              {campaign.creator_sizes.length > 0 && (
                <li className="flex justify-between items-start gap-3">
                  <span className="cr-meta-label shrink-0">{t('creatorSize')}</span>
                  <span className="cr-text-bright text-sm text-right capitalize">{campaign.creator_sizes.join(', ')}</span>
                </li>
              )}
            </ul>
          </NxHudCard>
        </div>
      </div>

      {/* ── Full-width Apply panel ── */}
      <NxHudCard as="div" className="px-6 py-4">
        {myApplication?.status === 'invited' ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00c8ff] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#00c8ff]">{t('invitedHeading')}</p>
                <p className="text-sm cr-text-muted">{t('invitedDesc')}</p>
              </div>
            </div>
            <InviteResponseButtons applicationId={myApplication.id} />
          </div>
        ) : campaign.status === 'launched' ? (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#a855f7] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#a855f7]">{t('campaignLaunched')}</p>
              {alreadyApplied ? (
                <p className="text-sm cr-text-muted">
                  {t('yourApplicationStatus')} <span className="capitalize cr-text-bright">{myApplication!.status}</span>
                </p>
              ) : (
                <p className="text-sm cr-text-muted">{t('notAccepting')}</p>
              )}
            </div>
          </div>
        ) : alreadyApplied ? (
          <div className="flex items-center gap-3">
            <span className="text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-[#22c55e]">{t('applicationSubmitted')}</p>
              <p className="text-sm cr-text-muted">{t('statusLabel')} <span className="capitalize cr-text-bright">{myApplication!.status}</span></p>
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
            legalAgeRestriction={campaign.legal_age_restriction ?? null}
          />
        )}
      </NxHudCard>
    </main>
    </CreatorShell>
  )
}
