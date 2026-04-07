import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDealRoom } from '../_actions'
import ProofSubmitForm from './ProofSubmitForm'
import { NX_FEE_RATE, calcFeeBreakdown } from '@/lib/constants'

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
  const { applicationId } = await params
  const app = await getDealRoom(applicationId)
  if (!app) notFound()

  const c = app.campaign
  const sub = app.deal_submission

  const hasDeliverables = c.num_videos || c.num_streams || c.num_posts || c.num_short_videos

  return (
    <main className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      <Link
        href="/creator/deal-room"
        className="inline-flex items-center gap-1.5 text-xs cr-text-muted hover:text-[#c8dff0] transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Deal Room
      </Link>

      {/* Header */}
      <div className="cr-panel p-5 sm:p-6">
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
            <p className="text-sm cr-text-muted mt-0.5">
              {c.sponsor.company_name ?? 'Sponsor'}
              {c.brand_name ? ` · ${c.brand_name}` : ''}
            </p>
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">

          {/* Mission Requirements */}
          {hasDeliverables && (
            <section className="cr-panel p-5">
              <h2 className="cr-panel-title">Mission Requirements</h2>
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
                    <span className="w-4 h-4 rounded border border-[#00c8ff]/40 flex-shrink-0" />
                    Include link in description/bio
                    {c.landing_page_url ? (
                      <a href={c.landing_page_url} target="_blank" rel="noopener noreferrer" className="cr-accent hover:underline text-xs">
                        {c.landing_page_url}
                      </a>
                    ) : null}
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
            </section>
          )}

          {/* Creative Package */}
          <section className="cr-panel p-5">
            <h2 className="cr-panel-title">Creative Package</h2>
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
              {c.landing_page_url && (
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
          </section>

          {/* Disclosure Reminder */}
          <section className="cr-panel p-5 border-[#eab308]/30" style={{ borderColor: 'rgba(234,179,8,0.25)' }}>
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
          </section>

          {/* Submit Proof */}
          <section className="cr-panel p-5">
            <h2 className="cr-panel-title">Submit Proof of Delivery</h2>
            <ProofSubmitForm applicationId={applicationId} existing={sub ?? null} />
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="cr-panel p-4">
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
          </div>

          {sub && (
            <div className="cr-panel p-4">
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
                {sub.admin_notes && (
                  <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20">
                    <dt className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">nx8up Admin</dt>
                    <dd className="text-red-300 text-xs leading-relaxed">{sub.admin_notes}</dd>
                  </div>
                )}
                {sub.sponsor_notes && (
                  <div className="rounded-lg p-3 bg-orange-500/10 border border-orange-500/20">
                    <dt className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1">Sponsor</dt>
                    <dd className="text-orange-300 text-xs leading-relaxed">{sub.sponsor_notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
