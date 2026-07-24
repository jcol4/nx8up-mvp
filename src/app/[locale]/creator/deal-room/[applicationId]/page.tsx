/**
 * Creator Deal Room detail page (`/creator/deal-room/[applicationId]`).
 *
 * Server component for an individual accepted campaign deal. Renders:
 *  - Header: campaign title, sponsor, submission status badge, payout amount.
 *  - Tracking link panel: shows either the creator's personalised short URL
 *    (`/r/[code]`) when a `tracking_short_code` exists, or the raw
 *    `landing_page_url` as a fallback. Includes a `CopyButton`.
 *  - Mission requirements: content deliverables + delivery checklist.
 *  - Creative package: brand/product details, content guidelines, video
 *    requirements, conversion goal, tracking method.
 *  - Disclosure reminder: FTC-required disclosure guidance for video/stream,
 *    social posts, YouTube, and Twitch.
 *  - Proof submission form (`ProofSubmitForm`).
 *  - Sidebar: campaign info, fee breakdown, submission status + payout status.
 *
 * The tracking URL is constructed server-side from the `host` header to
 * support both localhost and production environments.
 *
 * Calls `notFound()` when the application does not belong to the authenticated
 * creator or is not in "accepted" + "launched" state.
 *
 * External services: Prisma/PostgreSQL (via `getDealRoom`).
 *
 * Env vars: none directly; tracking URL uses the `host` request header.
 */
import { notFound } from 'next/navigation'
import { getTranslations, getFormatter } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { getDealRoom } from '../_actions'
import ProofSubmitForm from './ProofSubmitForm'
import { buildDeliverableSlots } from '@/lib/deliverable-slots'
import { calcFeeBreakdown } from '@/lib/constants'
import CopyButton from './CopyButton'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorShell from '@/components/creator/CreatorShell'
import NxHudCard from '@/components/nx-shell/NxHudCard'
import CollapsibleSection from '@/components/nx-shell/CollapsibleSection'
import { getClerkImageUrls, clerkAvatarUrl } from '@/lib/get-clerk-images'

export default async function CreatorDealRoomDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const t = await getTranslations('creator.dealRoom')
  const tEnum = await getTranslations('enums')
  const format = await getFormatter()
  const [{ sessionClaims }, { displayName, username }] = await Promise.all([auth(), getUserDisplayInfo()])
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { applicationId } = await params
  const app = await getDealRoom(applicationId)
  if (!app) notFound()

  const c = app.campaign
  const sponsorClerkId = (c.sponsor as typeof c.sponsor & { clerk_user_id?: string }).clerk_user_id
  const sponsorImages = await getClerkImageUrls(sponsorClerkId ? [sponsorClerkId] : [])
  const sponsorImageUrl = sponsorClerkId ? sponsorImages[sponsorClerkId] : undefined
  const sub = app.deal_submission

  // Build the personalised tracking URL for this creator
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'nx8up.com'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const trackingUrl = app.tracking_short_code
    ? `${proto}://${host}/r/${app.tracking_short_code}`
    : null

  const hasDeliverables =
    c.num_videos || c.num_streams || c.num_posts || c.num_short_videos || c.num_youtube_shorts || c.num_twitch_clips
  const deliverableSlots = buildDeliverableSlots(c)

  const hasBrief = c.description || c.campaign_type || c.product_type || c.campaign_code
  const hasCompliance = c.must_include_link || c.must_include_promo_code || c.must_tag_brand || c.legal_age_restriction

  const ctr = sub?.ctr != null ? Number(sub.ctr).toFixed(2) : null
  const videoViews = sub?.video_views as Record<string, number> | null | undefined
  const avgVideoViews =
    videoViews && Object.keys(videoViews).length > 0
      ? Math.round(Object.values(videoViews).reduce((a, b) => a + b, 0) / Object.values(videoViews).length)
      : null
  const clickCount = app._count.link_clicks
  const hasLinkPerformance = ctr !== null || avgVideoViews !== null || clickCount > 0

  return (
    <CreatorShell>
      <main className="creator-deal-room creator-deal-room-detail mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <Link
            href="/creator/deal-room"
            className="inline-flex items-center gap-1.5 text-sm cr-text-muted transition-colors hover:text-[#99f7ff]"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('back')}
          </Link>
        </div>

      {/* Header */}
      <NxHudCard as="div" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">{t('heading')}</span>
              {sub?.status === 'submitted' && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">{t('hdrSubmitted')}</span>
              )}
              {sub?.status === 'admin_verified' && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/20 text-[#00c8ff]">{t('hdrVerified')}</span>
              )}
              {sub?.status === 'admin_rejected' && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">{t('hdrRejected')}</span>
              )}
              {sub?.status === 'revision_requested' && (
                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">{t('hdrRevision')}</span>
              )}
              {sub?.status === 'approved' && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">{t('hdrApproved')}</span>
              )}
            </div>
            <h1 className="text-xl font-bold cr-text-bright">{c.title}</h1>
            <div className="mt-1 flex items-center gap-3">
              {sponsorImageUrl && (
                <Image
                  src={clerkAvatarUrl(sponsorImageUrl, 112)}
                  alt={c.sponsor.company_name ?? 'Sponsor'}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  unoptimized
                />
              )}
              <p className="text-sm text-[#d6dce6]">
                <span className="cr-text-bright font-medium">{c.sponsor.company_name ?? 'Sponsor'}</span>
                {c.brand_name ? <span className="cr-text-muted"> · {c.brand_name}</span> : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            {c.budget != null && (() => {
              const { perCreator } = calcFeeBreakdown(c.budget, c.creator_count)
              return perCreator ? (
                <>
                  <p className="text-lg font-bold cr-success">${format.number(perCreator)}</p>
                  <p className="cr-stat-caption">{t('yourPayout')}</p>
                </>
              ) : null
            })()}
            {c.end_date && (
              <p className="text-sm cr-meta-label mt-0.5">
                {t('deadline')}: {format.dateTime(new Date(c.end_date), 'numeric')}
              </p>
            )}
          </div>
        </div>
      </NxHudCard>

      {/* Tracking link — shown whenever the campaign has a link to include */}
      {(trackingUrl ?? c.landing_page_url) && (
        <NxHudCard as="div" className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#00c8ff] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-sm font-semibold text-[#00c8ff]">
              {trackingUrl ? t('trackingLinkHeading') : t('linkToIncludeHeading')}
            </p>
          </div>
          <p className="mb-3 text-sm leading-relaxed cr-text-muted">
            {trackingUrl ? t('trackingLinkDesc') : t('linkToIncludeDesc')}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-[#00c8ff]/20 bg-black/30 p-3">
            <code className="text-sm text-[#00c8ff] break-all flex-1 select-all">
              {trackingUrl ?? c.landing_page_url}
            </code>
            <CopyButton text={(trackingUrl ?? c.landing_page_url)!} />
          </div>
        </NxHudCard>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">

          {/* Mission Requirements */}
          {hasDeliverables && (
            <NxHudCard className="p-5">
              <h2 className="cr-panel-title">{t('missionReqs')}</h2>
              <p className="mb-4 mt-1 text-sm cr-text-muted">{t('missionReqsDesc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {c.num_videos ? (
                  <div className="text-center p-3 rounded-lg bg-[#00c8ff]/5 border border-[#00c8ff]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_videos}</p>
                    <p className="cr-stat-caption mt-1">{t('boxVideos', { n: c.num_videos })}</p>
                  </div>
                ) : null}
                {c.num_youtube_shorts ? (
                  <div className="text-center p-3 rounded-lg bg-[#00c8ff]/5 border border-[#00c8ff]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_youtube_shorts}</p>
                    <p className="cr-stat-caption mt-1">{t('boxYoutubeShorts', { n: c.num_youtube_shorts })}</p>
                  </div>
                ) : null}
                {c.num_streams ? (
                  <div className="text-center p-3 rounded-lg bg-[#7b4fff]/5 border border-[#7b4fff]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_streams}</p>
                    <p className="cr-stat-caption mt-1">{t('boxStreams', { n: c.num_streams })}</p>
                    {c.min_stream_duration && (
                      <p className="text-nx-10 text-[#c4ccd8]">{t('streamMin', { n: c.min_stream_duration })}</p>
                    )}
                  </div>
                ) : null}
                {c.num_twitch_clips ? (
                  <div className="text-center p-3 rounded-lg bg-[#7b4fff]/5 border border-[#7b4fff]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_twitch_clips}</p>
                    <p className="cr-stat-caption mt-1">{t('boxTwitchClips', { n: c.num_twitch_clips })}</p>
                  </div>
                ) : null}
                {c.num_posts ? (
                  <div className="text-center p-3 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_posts}</p>
                    <p className="cr-stat-caption mt-1">{t('boxPosts', { n: c.num_posts })}</p>
                  </div>
                ) : null}
                {c.num_short_videos ? (
                  <div className="text-center p-3 rounded-lg bg-[#eab308]/5 border border-[#eab308]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_short_videos}</p>
                    <p className="cr-stat-caption mt-1">{t('boxShorts', { n: c.num_short_videos })}</p>
                  </div>
                ) : null}
              </div>
            </NxHudCard>
          )}

          {/* Campaign Brief */}
          {hasBrief && (
            <CollapsibleSection title={t('campaignBrief')} description={t('campaignBriefDesc')}>
              <dl className="space-y-3">
                {c.description && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('descriptionLabel')}</dt>
                    <dd className="text-sm cr-text mt-0.5 whitespace-pre-line leading-relaxed">{c.description}</dd>
                  </div>
                )}
                {c.campaign_type && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('campaignType')}</dt>
                    <dd className="text-sm cr-text mt-0.5 capitalize">{c.campaign_type}</dd>
                  </div>
                )}
                {c.product_type && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('productType')}</dt>
                    <dd className="text-sm cr-text mt-0.5 capitalize">{c.product_type}</dd>
                  </div>
                )}
                {c.campaign_code && (
                  <div>
                    <dt className="cr-field-label mb-1">{t('campaignCode')}</dt>
                    <dd className="text-sm cr-text mt-0.5">{c.campaign_code}</dd>
                  </div>
                )}
              </dl>
            </CollapsibleSection>
          )}

          {/* Creative Package */}
          <NxHudCard className="p-5">
            <h2 className="cr-panel-title">{t('creativePackage')}</h2>
            <p className="mb-4 mt-1 text-sm cr-text-muted">{t('creativePackageDesc')}</p>
            <dl className="space-y-3">
              {c.brand_name && (
                <div>
                  <dt className="cr-field-label mb-1">{t('brand')}</dt>
                  <dd className="text-sm cr-text-bright font-medium mt-0.5">{c.brand_name}</dd>
                </div>
              )}
              {c.product_name && (
                <div>
                  <dt className="cr-field-label mb-1">{t('product')}</dt>
                  <dd className="text-sm cr-text-bright font-medium mt-0.5">{c.product_name}</dd>
                </div>
              )}
              {c.objective && (
                <div>
                  <dt className="cr-field-label mb-1">{t('campaignObjective')}</dt>
                  <dd className="text-sm cr-text mt-0.5 capitalize">{c.objective}</dd>
                </div>
              )}
              {c.landing_page_url && !trackingUrl && (
                <div>
                  <dt className="cr-field-label mb-1">{t('landingPage')}</dt>
                  <dd className="mt-0.5">
                    <a
                      href={c.landing_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm cr-accent hover:underline break-all"
                    >
                      {c.landing_page_url}
                    </a>
                  </dd>
                </div>
              )}
              {c.content_guidelines && (
                <div>
                  <dt className="cr-field-label mb-1">{t('contentGuidelines')}</dt>
                  <dd className="text-sm cr-text mt-0.5 whitespace-pre-line leading-relaxed">{c.content_guidelines}</dd>
                </div>
              )}
              {c.video_includes.length > 0 && (
                <div>
                  <dt className="cr-field-label mb-2">{t('mustInclude')}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {c.video_includes.map((item: string) => (
                      <span key={item} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                        {tEnum.has(`deliverable.${item}`) ? tEnum(`deliverable.${item}`) : item}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {c.conversion_goal && (
                <div>
                  <dt className="cr-field-label mb-1">{t('conversionGoal')}</dt>
                  <dd className="text-sm cr-text mt-0.5">{c.conversion_goal}</dd>
                </div>
              )}
              {c.tracking_type && (
                <div>
                  <dt className="cr-field-label mb-1">{t('trackingMethod')}</dt>
                  <dd className="text-sm cr-text mt-0.5 capitalize">{c.tracking_type}</dd>
                </div>
              )}
            </dl>
          </NxHudCard>

          {/* Compliance Requirements */}
          {hasCompliance && (
            <CollapsibleSection title={t('complianceTitle')} description={t('complianceDesc')} defaultOpen>
              <ul className="space-y-2 text-sm cr-text">
                {c.must_include_link && (
                  <li className="flex gap-2">
                    <span className="text-[#00c8ff] mt-0.5">▸</span> {t('compIncludeLink')}
                  </li>
                )}
                {c.must_include_promo_code && (
                  <li className="flex gap-2">
                    <span className="text-[#00c8ff] mt-0.5">▸</span> {t('compIncludePromo')}
                  </li>
                )}
                {c.must_tag_brand && (
                  <li className="flex gap-2">
                    <span className="text-[#00c8ff] mt-0.5">▸</span> {t('compTagBrand')}
                  </li>
                )}
                {c.legal_age_restriction && (
                  <li className="flex gap-2">
                    <span className="text-[#00c8ff] mt-0.5">▸</span>
                    {t('legalAgeRestriction')}: {c.legal_age_restriction}
                  </li>
                )}
              </ul>
            </CollapsibleSection>
          )}

          {/* Disclosure Reminder */}
          <NxHudCard className="p-5 border-[#eab308]/25">
            <h2 className="cr-panel-title" style={{ color: '#eab308' }}>{t('disclosureTitle')}</h2>
            <div className="space-y-3 text-sm cr-text">
              <p>
                {t('disclosureWarning')}
              </p>
              <ul className="space-y-1.5 pl-1">
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">{t('disclosureVideo')}</span> {t('disclosureVideoText')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">{t('disclosureSocial')}</span> {t('disclosureSocialText')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">{t('disclosureYoutube')}</span> {t('disclosureYoutubeText')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">{t('disclosureTwitch')}</span> {t('disclosureTwitchText')}</span>
                </li>
              </ul>
              <p className="text-sm cr-text-muted pt-1">
                {t('ftcReference')} <a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" target="_blank" rel="noopener noreferrer" className="cr-accent hover:underline">{t('ftcLink')}</a>
              </p>
            </div>
          </NxHudCard>

          {/* Submit Proof */}
          <NxHudCard className="p-5">
            <h2 className="cr-panel-title">{t('submitProofTitle')}</h2>
            <p className="mb-4 mt-1 text-sm cr-text-muted">{t('submitProofDesc')}</p>
            <ProofSubmitForm applicationId={applicationId} existing={sub ?? null} deliverableSlots={deliverableSlots} />
          </NxHudCard>

        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <NxHudCard as="div" className="p-4">
            <h3 className="cr-panel-title">{t('campaignInfo')}</h3>
            <dl className="space-y-2.5 text-sm">
              {c.payment_model && (
                <div className="flex justify-between gap-2">
                  <dt className="cr-meta-label">{t('payment')}</dt>
                  <dd className="cr-text-bright text-right capitalize">{c.payment_model.replace(/_/g, ' ')}</dd>
                </div>
              )}
              {c.budget != null && (() => {
                const { perCreator } = calcFeeBreakdown(c.budget, c.creator_count)
                return perCreator ? (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-meta-label">{t('payoutLabel')}</dt>
                    <dd className="cr-success font-bold">${format.number(perCreator)}</dd>
                  </div>
                ) : null
              })()}
              {c.start_date && (
                <div className="flex justify-between gap-2">
                  <dt className="cr-meta-label">{t('start')}</dt>
                  <dd className="cr-text-bright">{format.dateTime(new Date(c.start_date), 'numeric')}</dd>
                </div>
              )}
              {c.end_date && (
                <div className="flex justify-between gap-2">
                  <dt className="cr-meta-label">{t('deadline')}</dt>
                  <dd className="cr-text-bright">{format.dateTime(new Date(c.end_date), 'numeric')}</dd>
                </div>
              )}
              {c.platform.length > 0 && (
                <div>
                  <dt className="cr-meta-label mb-1">{t('platforms')}</dt>
                  <dd className="flex flex-wrap gap-1">
                    {c.platform.map((p: string) => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">{p}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </NxHudCard>

          {sub && (
            <NxHudCard as="div" className="p-4">
              <h3 className="cr-panel-title">{t('yourSubmission')}</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="cr-meta-label">{t('statusLabel')}</dt>
                  <dd className={
                    sub.status === 'approved'           ? 'text-green-400 font-medium' :
                    sub.status === 'admin_verified'     ? 'text-[#00c8ff] font-medium' :
                    sub.status === 'submitted'          ? 'text-yellow-400 font-medium' :
                    sub.status === 'revision_requested' ? 'text-orange-400 font-medium' :
                    sub.status === 'admin_rejected'     ? 'text-red-400 font-medium' :
                    'cr-text-muted'
                  }>
                    {sub.status === 'approved'           ? t('subApproved') :
                     sub.status === 'admin_verified'     ? t('subVerified') :
                     sub.status === 'submitted'          ? t('subSubmitted') :
                     sub.status === 'revision_requested' ? t('subRevisionNeeded') :
                     sub.status === 'admin_rejected'     ? t('subRejected') : t('subPending')}
                  </dd>
                </div>
                {sub.submitted_at && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-meta-label">{t('submittedLabel')}</dt>
                    <dd className="cr-text-bright text-right">{format.dateTime(new Date(sub.submitted_at), 'numeric')}</dd>
                  </div>
                )}
                {sub.status === 'approved' && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-meta-label">{t('payoutStatusLabel')}</dt>
                    <dd className={sub.payout_status === 'paid' ? 'text-[#22c55e] font-medium' : 'text-yellow-400'}>
                      {sub.payout_status === 'paid' ? t('payoutSent') : t('payoutPending')}
                    </dd>
                  </div>
                )}
                {sub.admin_notes && (
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20">
                    <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">{t('adminNotes')}</dt>
                    <dd className="text-red-300 text-xs leading-relaxed">{sub.admin_notes}</dd>
                  </div>
                )}
                {sub.sponsor_notes && (
                  <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-500/20">
                    <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-400">{t('sponsorNotes')}</dt>
                    <dd className="text-orange-300 text-xs leading-relaxed">{sub.sponsor_notes}</dd>
                  </div>
                )}
              </dl>
            </NxHudCard>
          )}

          {sub && hasLinkPerformance && (
            <CollapsibleSection title={t('linkPerformanceTitle')}>
              <dl className="space-y-2.5 text-sm">
                {clickCount > 0 && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-meta-label">{t('totalClicks')}</dt>
                    <dd className="cr-text-bright">{format.number(clickCount)}</dd>
                  </div>
                )}
                {ctr !== null && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-meta-label">{t('ctr')}</dt>
                    <dd className="cr-text-bright font-medium">{ctr}%</dd>
                  </div>
                )}
                {avgVideoViews !== null && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-meta-label">{t('avgVideoViews')}</dt>
                    <dd className="cr-text-bright">{format.number(avgVideoViews)}</dd>
                  </div>
                )}
              </dl>
            </CollapsibleSection>
          )}
        </div>
      </div>
      </main>
    </CreatorShell>
  )
}
