import { notFound } from 'next/navigation'
import Link from 'next/link'
import SponsorHeader from '../../SponsorHeader'
import { getDealRoomForSponsor } from '../_actions'
import ReviewButtons from './ReviewButtons'

const DELIVERABLE_LABELS: Record<string, string> = {
  gameplay_footage: 'Gameplay footage',
  facecam: 'Facecam',
  product_unboxing: 'Product unboxing',
  tutorial: 'Tutorial / how-to',
  review: 'Review',
  challenge: 'Challenge',
  sponsored_segment: 'Sponsored segment',
}

export default async function SponsorDealRoomDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { applicationId } = await params
  const app = await getDealRoomForSponsor(applicationId)
  if (!app) notFound()

  const c = app.campaign
  const sub = app.deal_submission
  const creator = app.creator

  const handle =
    creator.twitch_username
      ? `@${creator.twitch_username}`
      : creator.youtube_channel_name
        ? `@${creator.youtube_channel_name}`
        : 'Creator'

  const hasDeliverables = c.num_videos || c.num_streams || c.num_posts || c.num_short_videos

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link
            href="/sponsor/deal-room"
            className="inline-flex items-center gap-1.5 text-xs dash-text-muted hover:text-[#c8dff0] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deal Room
          </Link>

          {/* Header */}
          <div className="dash-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">Deal Room</span>
                  {(!sub || sub.status === 'pending') && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#94a3b8]/20 text-[#94a3b8]">Awaiting submission</span>
                  )}
                  {(sub?.status === 'submitted' || sub?.status === 'admin_rejected') && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#94a3b8]/20 text-[#94a3b8]">Under review</span>
                  )}
                  {sub?.status === 'admin_verified' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Needs your review</span>
                  )}
                  {sub?.status === 'revision_requested' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">Revision requested</span>
                  )}
                  {sub?.status === 'approved' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">Approved</span>
                  )}
                </div>
                <h1 className="text-xl font-bold dash-text-bright">{c.title}</h1>
                <p className="text-sm dash-text-muted mt-0.5">
                  Creator: <span className="dash-accent">{handle}</span>
                  {c.brand_name ? ` · ${c.brand_name}` : ''}
                </p>
              </div>
              <div className="text-right">
                {c.budget != null && (
                  <p className="text-lg font-bold" style={{ color: '#00e5a0' }}>${c.budget.toLocaleString()}</p>
                )}
                {c.end_date && (
                  <p className="text-xs dash-text-muted mt-0.5">
                    Deadline: {new Date(c.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-5">

              {/* Creator Submission */}
              <section className="dash-panel p-5">
                <h2 className="dash-panel-title">Creator Submission</h2>

                {/* Not yet submitted or pending admin review — hide content from sponsor */}
                {(!sub || sub.status === 'pending') && (
                  <p className="text-sm dash-text-muted py-4 text-center">
                    The creator has not submitted proof yet.
                  </p>
                )}
                {(sub?.status === 'submitted' || sub?.status === 'admin_rejected') && (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#94a3b8]/40 flex items-center justify-center mx-auto">
                      <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm dash-text-muted">Under review by nx8up admin.</p>
                    <p className="text-xs dash-text-muted">
                      You will be notified once the submission has been verified.
                    </p>
                  </div>
                )}

                {/* Admin verified — sponsor can now review */}
                {sub && (sub.status === 'admin_verified' || sub.status === 'approved' || sub.status === 'revision_requested') && (
                  <div className="space-y-4">
                    {sub.status === 'admin_verified' && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#00c8ff]/5 border border-[#00c8ff]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00c8ff] shrink-0" />
                        <p className="text-xs text-[#00c8ff]">Verified by nx8up admin — ready for your review.</p>
                      </div>
                    )}
                    <dl className="space-y-3">
                      {sub.proof_urls.length > 0 && (
                        <div>
                          <dt className="text-xs dash-text-muted uppercase tracking-wide mb-1">
                            Post URL{sub.proof_urls.length !== 1 ? 's' : ''}
                          </dt>
                          <dd className="space-y-1">
                            {sub.proof_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                className="block text-sm dash-accent hover:underline break-all">
                                {url}
                              </a>
                            ))}
                          </dd>
                        </div>
                      )}
                      {sub.screenshot_url && (
                        <div>
                          <dt className="text-xs dash-text-muted uppercase tracking-wide mb-1">Screenshot</dt>
                          <dd>
                            <a href={sub.screenshot_url} target="_blank" rel="noopener noreferrer"
                              className="text-sm dash-accent hover:underline break-all">
                              {sub.screenshot_url}
                            </a>
                          </dd>
                        </div>
                      )}
                      {sub.posted_at && (
                        <div>
                          <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Posted at</dt>
                          <dd className="text-sm dash-text-bright">{new Date(sub.posted_at).toLocaleString()}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Disclosure confirmed</dt>
                        <dd className={`text-sm font-medium ${sub.disclosure_confirmed ? 'text-green-400' : 'text-red-400'}`}>
                          {sub.disclosure_confirmed ? 'Yes — creator confirmed disclosure' : 'No'}
                        </dd>
                      </div>
                      {sub.submitted_at && (
                        <div>
                          <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Submitted</dt>
                          <dd className="text-sm dash-text-muted">{new Date(sub.submitted_at).toLocaleString()}</dd>
                        </div>
                      )}
                    </dl>

                    {sub.status === 'approved' ? (
                      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <p className="text-sm text-green-400 font-medium">Submission approved</p>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs font-semibold dash-text-muted uppercase tracking-wide mb-3">Your Review</p>
                        <ReviewButtons
                          applicationId={applicationId}
                          currentNotes={sub.sponsor_notes ?? null}
                        />
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Mission Requirements */}
              {hasDeliverables && (
                <section className="dash-panel p-5">
                  <h2 className="dash-panel-title">Mission Requirements</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {c.num_videos ? (
                      <div className="text-center p-3 rounded-lg bg-[#00c8ff]/5 border border-[#00c8ff]/15">
                        <p className="text-xl font-bold dash-text-bright">{c.num_videos}</p>
                        <p className="text-xs dash-text-muted mt-0.5">Video{c.num_videos !== 1 ? 's' : ''}</p>
                      </div>
                    ) : null}
                    {c.num_streams ? (
                      <div className="text-center p-3 rounded-lg bg-[#7b4fff]/5 border border-[#7b4fff]/15">
                        <p className="text-xl font-bold dash-text-bright">{c.num_streams}</p>
                        <p className="text-xs dash-text-muted mt-0.5">Stream{c.num_streams !== 1 ? 's' : ''}</p>
                        {c.min_stream_duration && (
                          <p className="text-xs dash-text-muted">≥ {c.min_stream_duration} min</p>
                        )}
                      </div>
                    ) : null}
                    {c.num_posts ? (
                      <div className="text-center p-3 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/15">
                        <p className="text-xl font-bold dash-text-bright">{c.num_posts}</p>
                        <p className="text-xs dash-text-muted mt-0.5">Post{c.num_posts !== 1 ? 's' : ''}</p>
                      </div>
                    ) : null}
                    {c.num_short_videos ? (
                      <div className="text-center p-3 rounded-lg bg-[#eab308]/5 border border-[#eab308]/15">
                        <p className="text-xl font-bold dash-text-bright">{c.num_short_videos}</p>
                        <p className="text-xs dash-text-muted mt-0.5">Short{c.num_short_videos !== 1 ? 's' : ''}</p>
                      </div>
                    ) : null}
                  </div>
                  <ul className="space-y-1.5 text-sm dash-text">
                    {c.must_include_link && c.landing_page_url && (
                      <li className="flex gap-2">
                        <span className="dash-accent">▸</span>
                        Include link: <a href={c.landing_page_url} target="_blank" rel="noopener noreferrer" className="dash-accent hover:underline">{c.landing_page_url}</a>
                      </li>
                    )}
                    {c.must_include_promo_code && (
                      <li className="flex gap-2"><span className="dash-accent">▸</span> Include promo code</li>
                    )}
                    {c.must_tag_brand && (
                      <li className="flex gap-2"><span className="dash-accent">▸</span> Tag / mention the brand</li>
                    )}
                  </ul>
                </section>
              )}

              {/* Creative Package */}
              <section className="dash-panel p-5">
                <h2 className="dash-panel-title">Creative Package</h2>
                <dl className="space-y-3 text-sm">
                  {c.brand_name && (
                    <div>
                      <dt className="text-xs dash-text-muted uppercase tracking-wide">Brand</dt>
                      <dd className="dash-text-bright font-medium mt-0.5">{c.brand_name}</dd>
                    </div>
                  )}
                  {c.product_name && (
                    <div>
                      <dt className="text-xs dash-text-muted uppercase tracking-wide">Product</dt>
                      <dd className="dash-text-bright font-medium mt-0.5">{c.product_name}</dd>
                    </div>
                  )}
                  {c.content_guidelines && (
                    <div>
                      <dt className="text-xs dash-text-muted uppercase tracking-wide">Content Guidelines</dt>
                      <dd className="dash-text mt-0.5 whitespace-pre-line leading-relaxed">{c.content_guidelines}</dd>
                    </div>
                  )}
                  {c.video_includes.length > 0 && (
                    <div>
                      <dt className="text-xs dash-text-muted uppercase tracking-wide mb-1.5">Must Include</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {c.video_includes.map((item: string) => (
                          <span key={item} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">
                            {DELIVERABLE_LABELS[item] ?? item}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="dash-panel p-4">
                <h3 className="dash-panel-title">Creator</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="dash-text-muted">Handle</dt>
                    <dd className="dash-text-bright text-right">{handle}</dd>
                  </div>
                  {creator.platform.length > 0 && (
                    <div>
                      <dt className="dash-text-muted mb-1">Platforms</dt>
                      <dd className="flex flex-wrap gap-1">
                        {creator.platform.map((p: string) => (
                          <span key={p} className="text-xs px-2 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e]">{p}</span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {(creator.subs_followers != null || creator.youtube_subscribers != null) && (
                    <div className="flex justify-between gap-2">
                      <dt className="dash-text-muted">Followers</dt>
                      <dd className="dash-text-bright">
                        {(creator.subs_followers ?? creator.youtube_subscribers ?? 0).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="dash-panel p-4">
                <h3 className="dash-panel-title">Campaign</h3>
                <dl className="space-y-2 text-sm">
                  {c.payment_model && (
                    <div className="flex justify-between gap-2">
                      <dt className="dash-text-muted">Payment</dt>
                      <dd className="dash-text-bright capitalize">{c.payment_model.replace(/_/g, ' ')}</dd>
                    </div>
                  )}
                  {c.budget != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="dash-text-muted">Budget</dt>
                      <dd className="font-bold" style={{ color: '#00e5a0' }}>${c.budget.toLocaleString()}</dd>
                    </div>
                  )}
                  {c.end_date && (
                    <div className="flex justify-between gap-2">
                      <dt className="dash-text-muted">Deadline</dt>
                      <dd className="dash-text">{new Date(c.end_date).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
