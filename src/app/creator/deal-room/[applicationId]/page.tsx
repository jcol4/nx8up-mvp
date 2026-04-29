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
import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { getDealRoom } from '../_actions'
import ProofSubmitForm from './ProofSubmitForm'
import { NX_FEE_RATE, calcFeeBreakdown } from '@/lib/constants'
import CopyButton from './CopyButton'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorShell from '@/components/creator/CreatorShell'
import NxHudCard from '@/components/nx-shell/NxHudCard'
import { getClerkImageUrls } from '@/lib/get-clerk-images'

const DELIVERABLE_LABELS: Record<string, string> = {
  gameplay_footage: 'Gameplay footage',
  facecam: 'Facecam',
  product_unboxing: 'Product unboxing',
  tutorial: 'Tutorial / how-to',
  review: 'Review',
  challenge: 'Challenge',
  sponsored_segment: 'Sponsored segment',
}

export default async function CreatorDealRoomDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
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

  const hasDeliverables = c.num_videos || c.num_streams || c.num_posts || c.num_short_videos

  return (
    <CreatorShell>
      <main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <Link
            href="/creator/deal-room"
            className="inline-flex items-center gap-1.5 text-xs cr-text-muted transition-colors hover:text-[#c8dff0]"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deal Room
          </Link>
        </div>

      {/* Header */}
      <NxHudCard as="div" className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">Deal Room</span>
              {sub?.status === 'submitted' && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Submitted — pending review</span>
              )}
              {sub?.status === 'admin_verified' && (
                <span className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/20 text-[#00c8ff]">Verified — awaiting sponsor</span>
              )}
              {sub?.status === 'admin_rejected' && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Rejected — resubmit required</span>
              )}
              {sub?.status === 'revision_requested' && (
                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">Revision requested</span>
              )}
              {sub?.status === 'approved' && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">Approved</span>
              )}
            </div>
            <h1 className="text-xl font-bold cr-text-bright">{c.title}</h1>
            <div className="mt-1 flex items-center gap-3">
              {sponsorImageUrl && (
                <Image
                  src={sponsorImageUrl}
                  alt={c.sponsor.company_name ?? 'Sponsor'}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  unoptimized
                />
              )}
              <p className="text-sm cr-text-muted">
                {c.sponsor.company_name ?? 'Sponsor'}
                {c.brand_name ? ` · ${c.brand_name}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            {c.budget != null && (() => {
              const { perCreator, creatorPool } = calcFeeBreakdown(c.budget, c.creator_count)
              return (
                <>
                  <p className="text-lg font-bold cr-success">${(perCreator ?? creatorPool).toLocaleString()}</p>
                  <p className="text-[10px] cr-text-muted">{perCreator ? 'your payout' : 'creator pool'}</p>
                </>
              )
            })()}
            {c.end_date && (
              <p className="text-xs cr-text-muted mt-0.5">
                Deadline: {new Date(c.end_date).toLocaleDateString()}
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
              {trackingUrl ? 'Your Tracking Link' : 'Link to Include'}
            </p>
          </div>
          <p className="mb-3 text-xs leading-relaxed cr-text-muted">
            {trackingUrl
              ? 'Use this personalised link in your bio and content description. Every click is tracked and counts toward your campaign performance.'
              : 'Include this link in your bio and content description as specified by the sponsor.'}
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
              <h2 className="cr-panel-title">Mission Requirements</h2>
              <p className="mb-4 mt-1 text-xs cr-text-muted">Complete each required deliverable before submitting proof.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {c.num_videos ? (
                  <div className="text-center p-3 rounded-lg bg-[#00c8ff]/5 border border-[#00c8ff]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_videos}</p>
                    <p className="text-xs cr-text-muted mt-0.5">Video{c.num_videos !== 1 ? 's' : ''}</p>
                  </div>
                ) : null}
                {c.num_streams ? (
                  <div className="text-center p-3 rounded-lg bg-[#7b4fff]/5 border border-[#7b4fff]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_streams}</p>
                    <p className="text-xs cr-text-muted mt-0.5">Stream{c.num_streams !== 1 ? 's' : ''}</p>
                    {c.min_stream_duration && (
                      <p className="text-xs cr-text-muted">≥ {c.min_stream_duration} min</p>
                    )}
                  </div>
                ) : null}
                {c.num_posts ? (
                  <div className="text-center p-3 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_posts}</p>
                    <p className="text-xs cr-text-muted mt-0.5">Post{c.num_posts !== 1 ? 's' : ''}</p>
                  </div>
                ) : null}
                {c.num_short_videos ? (
                  <div className="text-center p-3 rounded-lg bg-[#eab308]/5 border border-[#eab308]/15">
                    <p className="text-xl font-bold cr-text-bright">{c.num_short_videos}</p>
                    <p className="text-xs cr-text-muted mt-0.5">Short{c.num_short_videos !== 1 ? 's' : ''}</p>
                  </div>
                ) : null}
              </div>

              {/* Checklist */}
              <h3 className="text-xs font-semibold cr-text-muted uppercase tracking-wide mb-3">Delivery Checklist</h3>
              <ul className="space-y-2">
                {c.num_videos ? (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0 flex items-center justify-center">
                      {sub?.status === 'approved' ? <span className="text-green-400 text-xs">✓</span> : null}
                    </span>
                    Publish {c.num_videos} sponsored video{c.num_videos !== 1 ? 's' : ''}
                  </li>
                ) : null}
                {c.num_streams ? (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0 flex items-center justify-center">
                      {sub?.status === 'approved' ? <span className="text-green-400 text-xs">✓</span> : null}
                    </span>
                    Stream {c.num_streams} session{c.num_streams !== 1 ? 's' : ''}
                    {c.min_stream_duration ? ` (min ${c.min_stream_duration} min each)` : ''}
                  </li>
                ) : null}
                {c.num_posts ? (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0 flex items-center justify-center">
                      {sub?.status === 'approved' ? <span className="text-green-400 text-xs">✓</span> : null}
                    </span>
                    Publish {c.num_posts} social post{c.num_posts !== 1 ? 's' : ''}
                  </li>
                ) : null}
                {c.num_short_videos ? (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0 flex items-center justify-center">
                      {sub?.status === 'approved' ? <span className="text-green-400 text-xs">✓</span> : null}
                    </span>
                    Post {c.num_short_videos} short-form video{c.num_short_videos !== 1 ? 's' : ''}
                  </li>
                ) : null}
                {c.must_include_link && (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0 flex items-center justify-center">
                      {sub?.status === 'approved' ? <span className="text-green-400 text-xs">✓</span> : null}
                    </span>
                    Include your tracking link in description/bio
                  </li>
                )}
                {c.must_include_promo_code && (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0" />
                    Include promo code on-screen / in description
                  </li>
                )}
                {c.must_tag_brand && (
                  <li className="flex items-center gap-2 text-sm cr-text">
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0" />
                    Tag / mention the brand
                  </li>
                )}
                <li className="flex items-center gap-2 text-sm cr-text">
                  <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0" />
                  Add sponsorship disclosure (#ad or verbal)
                </li>
                <li className="flex items-center gap-2 text-sm cr-text">
                  <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0" />
                  Submit proof below
                </li>
              </ul>
            </NxHudCard>
          )}

          {/* Creative Package */}
          <NxHudCard className="p-5">
            <h2 className="cr-panel-title">Creative Package</h2>
            <p className="mb-4 mt-1 text-xs cr-text-muted">Use this brief as your source of truth for production details.</p>
            <dl className="space-y-3">
              {c.brand_name && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Brand</dt>
                  <dd className="text-sm cr-text-bright font-medium mt-0.5">{c.brand_name}</dd>
                </div>
              )}
              {c.product_name && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Product</dt>
                  <dd className="text-sm cr-text-bright font-medium mt-0.5">{c.product_name}</dd>
                </div>
              )}
              {c.objective && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Campaign Objective</dt>
                  <dd className="text-sm cr-text mt-0.5 capitalize">{c.objective}</dd>
                </div>
              )}
              {c.landing_page_url && !trackingUrl && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Landing Page / Link to Include</dt>
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
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Content Guidelines</dt>
                  <dd className="text-sm cr-text mt-0.5 whitespace-pre-line leading-relaxed">{c.content_guidelines}</dd>
                </div>
              )}
              {c.video_includes.length > 0 && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide mb-1.5">Must Include in Content</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {c.video_includes.map((item: string) => (
                      <span key={item} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                        {DELIVERABLE_LABELS[item] ?? item}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {c.conversion_goal && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Conversion Goal</dt>
                  <dd className="text-sm cr-text mt-0.5">{c.conversion_goal}</dd>
                </div>
              )}
              {c.tracking_type && (
                <div>
                  <dt className="text-xs cr-text-muted uppercase tracking-wide">Tracking Method</dt>
                  <dd className="text-sm cr-text mt-0.5 capitalize">{c.tracking_type}</dd>
                </div>
              )}
            </dl>
          </NxHudCard>

          {/* Disclosure Reminder */}
          <NxHudCard className="p-5 border-[#eab308]/25">
            <h2 className="cr-panel-title" style={{ color: '#eab308' }}>Disclosure Reminder</h2>
            <div className="space-y-3 text-sm cr-text">
              <p>
                As a paid content creator you are <span className="cr-text-bright font-medium">legally required</span> to
                disclose your sponsored relationship before publishing. Failure to do so can result in FTC enforcement action.
              </p>
              <ul className="space-y-1.5 pl-1">
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">Video / Stream:</span> Say &quot;This video/stream is sponsored by [Brand]&quot; at or near the beginning. Add #ad or #sponsored to the title or description.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">Social posts:</span> Use #ad, #sponsored, or the platform&apos;s native paid-partnership label — visible without expanding &quot;more&quot;.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">YouTube:</span> Enable the &quot;Paid promotion&quot; toggle in upload settings.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#eab308] mt-0.5">▸</span>
                  <span><span className="cr-text-bright">Twitch:</span> Check the &quot;This is an Ad or Sponsored Content&quot; box in your stream settings or announce verbally at the start.</span>
                </li>
              </ul>
              <p className="text-xs cr-text-muted pt-1">
                Reference: <a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" target="_blank" rel="noopener noreferrer" className="cr-accent hover:underline">FTC Endorsement Guides</a>
              </p>
            </div>
          </NxHudCard>

          {/* Submit Proof */}
          <NxHudCard className="p-5">
            <h2 className="cr-panel-title">Submit Proof of Delivery</h2>
            <p className="mb-4 mt-1 text-xs cr-text-muted">Submit your links once content is live and disclosures are in place.</p>
            <ProofSubmitForm applicationId={applicationId} existing={sub ?? null} />
          </NxHudCard>

        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <NxHudCard as="div" className="p-4">
            <h3 className="cr-panel-title">Campaign Info</h3>
            <dl className="space-y-2.5 text-sm">
              {c.payment_model && (
                <div className="flex justify-between gap-2">
                  <dt className="cr-text-muted">Payment</dt>
                  <dd className="cr-text-bright text-right capitalize">{c.payment_model.replace(/_/g, ' ')}</dd>
                </div>
              )}
              {c.budget != null && (() => {
                const { fee, creatorPool, perCreator } = calcFeeBreakdown(c.budget, c.creator_count)
                return (
                  <>
                    {perCreator && (
                      <div className="flex justify-between gap-2">
                        <dt className="cr-text-muted">Your Payout</dt>
                        <dd className="cr-success font-bold">${perCreator.toLocaleString()}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt className="cr-text-muted">Creator Pool</dt>
                      <dd className="cr-success font-semibold">${creatorPool.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between gap-2 text-[11px]">
                      <dt className="cr-text-muted">Total Budget</dt>
                      <dd className="cr-text">${c.budget.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between gap-2 text-[11px]">
                      <dt className="cr-text-muted">nx8up Fee ({Math.round(NX_FEE_RATE * 100)}%)</dt>
                      <dd className="text-red-400/70">−${fee.toLocaleString()}</dd>
                    </div>
                  </>
                )
              })()}
              {c.start_date && (
                <div className="flex justify-between gap-2">
                  <dt className="cr-text-muted">Start</dt>
                  <dd className="cr-text">{new Date(c.start_date).toLocaleDateString()}</dd>
                </div>
              )}
              {c.end_date && (
                <div className="flex justify-between gap-2">
                  <dt className="cr-text-muted">Deadline</dt>
                  <dd className="cr-text">{new Date(c.end_date).toLocaleDateString()}</dd>
                </div>
              )}
              {c.platform.length > 0 && (
                <div>
                  <dt className="cr-text-muted mb-1">Platforms</dt>
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
              <h3 className="cr-panel-title">Your Submission</h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="cr-text-muted">Status</dt>
                  <dd className={
                    sub.status === 'approved'           ? 'text-green-400 font-medium' :
                    sub.status === 'admin_verified'     ? 'text-[#00c8ff] font-medium' :
                    sub.status === 'submitted'          ? 'text-yellow-400 font-medium' :
                    sub.status === 'revision_requested' ? 'text-orange-400 font-medium' :
                    sub.status === 'admin_rejected'     ? 'text-red-400 font-medium' :
                    'cr-text-muted'
                  }>
                    {sub.status === 'approved'           ? 'Approved' :
                     sub.status === 'admin_verified'     ? 'Verified — awaiting sponsor' :
                     sub.status === 'submitted'          ? 'Pending review' :
                     sub.status === 'revision_requested' ? 'Revision needed' :
                     sub.status === 'admin_rejected'     ? 'Rejected — resubmit' : 'Pending'}
                  </dd>
                </div>
                {sub.submitted_at && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-text-muted">Submitted</dt>
                    <dd className="cr-text text-right">{new Date(sub.submitted_at).toLocaleDateString()}</dd>
                  </div>
                )}
                {sub.status === 'approved' && (
                  <div className="flex justify-between gap-2">
                    <dt className="cr-text-muted">Payout</dt>
                    <dd className={sub.payout_status === 'paid' ? 'text-[#22c55e] font-medium' : 'text-yellow-400'}>
                      {sub.payout_status === 'paid' ? 'Sent' : 'Pending'}
                    </dd>
                  </div>
                )}
                {sub.admin_notes && (
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20">
                    <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">nx8up Admin Notes</dt>
                    <dd className="text-red-300 text-xs leading-relaxed">{sub.admin_notes}</dd>
                  </div>
                )}
                {sub.sponsor_notes && (
                  <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-500/20">
                    <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-400">Sponsor Notes</dt>
                    <dd className="text-orange-300 text-xs leading-relaxed">{sub.sponsor_notes}</dd>
                  </div>
                )}
              </dl>
            </NxHudCard>
          )}
        </div>
      </div>
      </main>
    </CreatorShell>
  )
}
