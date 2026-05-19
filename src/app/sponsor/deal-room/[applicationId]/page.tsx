import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDealRoomForSponsor } from '../_actions'
import ReviewButtons from './ReviewButtons'
import RetryPayoutButton from './RetryPayoutButton'
import { NX_FEE_RATE, calcFeeBreakdown } from '@/lib/constants'
import NxHudCard from '@/components/nx-shell/NxHudCard'
import SponsorHeader from '../../_components/dashboard/SponsorHeader'

const DELIVERABLE_LABELS: Record<string, string> = {
  gameplay_footage: 'Gameplay footage',
  facecam: 'Facecam',
  product_unboxing: 'Product unboxing',
  tutorial: 'Tutorial / how-to',
  review: 'Review',
  challenge: 'Challenge',
  sponsored_segment: 'Sponsored segment',
}

const SUB_STATUS: Record<string, { label: string; badge: string; border: string }> = {
  pending: {
    label: 'Awaiting submission',
    badge: 'bg-slate-500/20 text-slate-200 border border-slate-400/40',
    border: 'border-l-slate-400/80',
  },
  submitted: {
    label: 'Under admin review',
    badge: 'bg-[#99f7ff]/12 text-[#99f7ff] border border-[#99f7ff]/30',
    border: 'border-l-[#99f7ff]/50',
  },
  admin_rejected: {
    label: 'Under admin review',
    badge: 'bg-[#99f7ff]/12 text-[#99f7ff] border border-[#99f7ff]/30',
    border: 'border-l-[#99f7ff]/50',
  },
  admin_verified: {
    label: 'Needs your review',
    badge: 'bg-[#eab308]/20 text-[#facc15] border border-[#eab308]/35',
    border: 'border-l-[#eab308]/70',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/35',
    border: 'border-l-[#22c55e]/70',
  },
  revision_requested: {
    label: 'Revision requested',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/35',
    border: 'border-l-orange-500/60',
  },
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="sp-app-stat-label">{label}</p>
      <div className="sp-app-stat-value mt-0.5">{value}</div>
    </div>
  )
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="sp-app-stat-label shrink-0">{label}</span>
      <span className="sp-app-stat-value text-right">{children}</span>
    </div>
  )
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
  const clickCount = app._count.link_clicks
  const ctr = sub?.ctr != null ? Number(sub.ctr).toFixed(2) : null
  const videoViews = sub?.video_views as Record<string, number> | null | undefined
  const avgVideoViews =
    videoViews && Object.keys(videoViews).length > 0
      ? Math.round(
          Object.values(videoViews).reduce((a, b) => a + b, 0) / Object.values(videoViews).length,
        )
      : null

  const handle =
    creator.twitch_username
      ? `@${creator.twitch_username}`
      : creator.youtube_channel_name
        ? `@${creator.youtube_channel_name}`
        : 'Creator'

  const hasDeliverables = c.num_videos || c.num_streams || c.num_posts || c.num_short_videos
  const statusKey = sub?.status ?? 'pending'
  const status = SUB_STATUS[statusKey] ?? SUB_STATUS.pending
  const { fee, creatorPool, perCreator } =
    c.budget != null ? calcFeeBreakdown(c.budget, c.creator_count) : { fee: 0, creatorPool: 0, perCreator: null }

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="sponsor-deal-room sponsor-deal-room-detail mx-auto max-w-5xl space-y-6">
          <Link
            href="/sponsor/deal-room"
            className="inline-flex items-center gap-2 text-sm text-[#99f7ff] transition-colors hover:text-[#bffcff]"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deal Room
          </Link>

          <header
            className={`dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-l-4 bg-black/20 p-5 sm:p-6 ${status.border}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="cr-field-label">Deal room</p>
                <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">
                  {c.title}
                </h1>
                <p className="mt-2 text-sm cr-text-muted">
                  Creator: <span className="font-medium text-[#99f7ff]">{handle}</span>
                  {c.brand_name ? ` · ${c.brand_name}` : ''}
                </p>
                <div className="mt-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
              {c.budget != null && (
                <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-3 text-right">
                  <p className="font-headline text-xl font-semibold tabular-nums text-[#4ade80]">
                    ${c.budget.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs cr-stat-caption">
                    ${creatorPool.toLocaleString()} creator pool · −${fee.toLocaleString()} fee
                  </p>
                  {c.end_date && (
                    <p className="mt-1 text-xs cr-stat-caption">
                      Deadline {new Date(c.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              <NxHudCard as="section" className="p-5 sm:p-6">
                <h2 className="cr-field-label mb-4">Creator submission</h2>

                {(!sub || sub.status === 'pending') && (
                  <div className="sp-app-stat-panel rounded-lg p-6 text-center">
                    <p className="text-sm cr-text-muted">The creator has not submitted proof yet.</p>
                  </div>
                )}

                {(sub?.status === 'submitted' || sub?.status === 'admin_rejected') && (
                  <div className="sp-app-stat-panel space-y-2 rounded-lg p-6 text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#99f7ff]/40">
                      <svg
                        className="h-4 w-4 text-[#99f7ff]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm cr-text">Under review by nx8up admin.</p>
                    <p className="text-sm cr-text-muted">
                      You will be notified once the submission has been verified.
                    </p>
                  </div>
                )}

                {sub &&
                  (sub.status === 'admin_verified' ||
                    sub.status === 'approved' ||
                    sub.status === 'revision_requested') && (
                    <div className="space-y-4">
                      {sub.status === 'admin_verified' && (
                        <div className="rounded-lg border border-[#99f7ff]/25 bg-[#99f7ff]/8 px-3 py-2.5">
                          <p className="text-sm text-[#99f7ff]">
                            Verified by nx8up admin — ready for your review.
                          </p>
                        </div>
                      )}

                      <div className="sp-app-stat-panel space-y-4 rounded-lg p-4">
                        {sub.proof_urls.length > 0 && (
                          <Field
                            label={`Post URL${sub.proof_urls.length !== 1 ? 's' : ''}`}
                            value={
                              <span className="space-y-1 block">
                                {sub.proof_urls.map((url, i) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block break-all text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                                  >
                                    {url}
                                  </a>
                                ))}
                              </span>
                            }
                          />
                        )}
                        {sub.screenshot_url && (
                          <Field
                            label="Screenshot"
                            value={
                              <a
                                href={sub.screenshot_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                              >
                                {sub.screenshot_url}
                              </a>
                            }
                          />
                        )}
                        {sub.posted_at && (
                          <Field
                            label="Posted at"
                            value={new Date(sub.posted_at).toLocaleString()}
                          />
                        )}
                        <Field
                          label="Disclosure confirmed"
                          value={
                            <span
                              className={
                                sub.disclosure_confirmed ? 'text-[#4ade80]' : 'text-red-400'
                              }
                            >
                              {sub.disclosure_confirmed
                                ? 'Yes — creator confirmed disclosure'
                                : 'No'}
                            </span>
                          }
                        />
                        {sub.submitted_at && (
                          <Field
                            label="Submitted"
                            value={new Date(sub.submitted_at).toLocaleString()}
                          />
                        )}
                      </div>

                      {sub.status === 'approved' ? (
                        <div className="space-y-2 border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                            <p className="text-sm font-medium text-[#4ade80]">Submission approved</p>
                          </div>
                          {sub.payout_status === 'paid' ? (
                            <div className="rounded-lg border border-[#22c55e]/25 bg-[#22c55e]/8 px-3 py-2.5">
                              <p className="text-sm text-[#4ade80]">
                                Payout sent to creator
                                {sub.stripe_transfer_id ? ` · ${sub.stripe_transfer_id}` : ''}
                              </p>
                            </div>
                          ) : (
                            <RetryPayoutButton applicationId={applicationId} />
                          )}
                        </div>
                      ) : (
                        <div className="border-t border-white/10 pt-4">
                          <p className="cr-field-label mb-3">Your review</p>
                          <ReviewButtons
                            applicationId={applicationId}
                            currentNotes={sub.sponsor_notes ?? null}
                          />
                        </div>
                      )}
                    </div>
                  )}
              </NxHudCard>

              {hasDeliverables && (
                <NxHudCard as="section" className="p-5 sm:p-6">
                  <h2 className="cr-field-label mb-4">Mission requirements</h2>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {c.num_videos ? (
                      <div className="sp-app-stat-panel rounded-lg p-3 text-center">
                        <p className="font-headline text-xl font-semibold text-[#e8f4ff]">{c.num_videos}</p>
                        <p className="mt-0.5 text-xs cr-stat-caption">
                          Video{c.num_videos !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ) : null}
                    {c.num_streams ? (
                      <div className="sp-app-stat-panel rounded-lg p-3 text-center">
                        <p className="font-headline text-xl font-semibold text-[#e8f4ff]">{c.num_streams}</p>
                        <p className="mt-0.5 text-xs cr-stat-caption">
                          Stream{c.num_streams !== 1 ? 's' : ''}
                        </p>
                        {c.min_stream_duration && (
                          <p className="text-xs cr-stat-caption">≥ {c.min_stream_duration} min</p>
                        )}
                      </div>
                    ) : null}
                    {c.num_posts ? (
                      <div className="sp-app-stat-panel rounded-lg p-3 text-center">
                        <p className="font-headline text-xl font-semibold text-[#e8f4ff]">{c.num_posts}</p>
                        <p className="mt-0.5 text-xs cr-stat-caption">
                          Post{c.num_posts !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ) : null}
                    {c.num_short_videos ? (
                      <div className="sp-app-stat-panel rounded-lg p-3 text-center">
                        <p className="font-headline text-xl font-semibold text-[#e8f4ff]">
                          {c.num_short_videos}
                        </p>
                        <p className="mt-0.5 text-xs cr-stat-caption">
                          Short{c.num_short_videos !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <ul className="space-y-2 text-sm cr-text">
                    {c.must_include_link && c.landing_page_url && (
                      <li className="flex gap-2">
                        <span className="text-[#99f7ff]">▸</span>
                        Include link:{' '}
                        <a
                          href={c.landing_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#99f7ff] hover:text-[#bffcff] hover:underline"
                        >
                          {c.landing_page_url}
                        </a>
                      </li>
                    )}
                    {c.must_include_promo_code && (
                      <li className="flex gap-2">
                        <span className="text-[#99f7ff]">▸</span> Include promo code
                      </li>
                    )}
                    {c.must_tag_brand && (
                      <li className="flex gap-2">
                        <span className="text-[#99f7ff]">▸</span> Tag / mention the brand
                      </li>
                    )}
                  </ul>
                </NxHudCard>
              )}

              <NxHudCard as="section" className="p-5 sm:p-6">
                <h2 className="cr-field-label mb-4">Creative package</h2>
                <div className="sp-app-stat-panel space-y-4 rounded-lg p-4">
                  {c.brand_name && <Field label="Brand" value={c.brand_name} />}
                  {c.product_name && <Field label="Product" value={c.product_name} />}
                  {c.content_guidelines && (
                    <Field
                      label="Content guidelines"
                      value={
                        <span className="whitespace-pre-line leading-relaxed">{c.content_guidelines}</span>
                      }
                    />
                  )}
                  {c.video_includes.length > 0 && (
                    <div>
                      <p className="sp-app-stat-label mb-2">Must include</p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.video_includes.map((item: string) => (
                          <span
                            key={item}
                            className="rounded-lg border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#c8dff0]"
                          >
                            {DELIVERABLE_LABELS[item] ?? item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </NxHudCard>
            </div>

            <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
              <NxHudCard as="div" className="p-4 sm:p-5">
                <h3 className="cr-field-label mb-3">Creator</h3>
                <div className="space-y-2">
                  <SideRow label="Handle" children={handle} />
                  {creator.platform.length > 0 && (
                    <div>
                      <p className="sp-app-stat-label mb-1.5">Platforms</p>
                      <div className="flex flex-wrap gap-1">
                        {creator.platform.map((p: string) => (
                          <span
                            key={p}
                            className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-0.5 text-xs text-[#4ade80]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(creator.subs_followers != null || creator.youtube_subscribers != null) && (
                    <SideRow
                      label="Followers"
                      children={(
                        creator.subs_followers ??
                        creator.youtube_subscribers ??
                        0
                      ).toLocaleString()}
                    />
                  )}
                </div>
              </NxHudCard>

              {app.tracking_short_code && (
                <NxHudCard as="div" className="p-4 sm:p-5">
                  <h3 className="cr-field-label mb-3">Link performance</h3>
                  <div className="space-y-2">
                    <SideRow label="Total clicks" children={clickCount.toLocaleString()} />
                    {ctr !== null && (
                      <SideRow
                        label="CTR"
                        children={<span className="font-semibold text-[#99f7ff]">{ctr}%</span>}
                      />
                    )}
                    {avgVideoViews !== null && (
                      <SideRow label="Avg video views" children={avgVideoViews.toLocaleString()} />
                    )}
                  </div>
                </NxHudCard>
              )}

              <NxHudCard as="div" className="p-4 sm:p-5">
                <h3 className="cr-field-label mb-3">Campaign</h3>
                <div className="space-y-2">
                  {c.payment_model && (
                    <SideRow
                      label="Payment"
                      children={<span className="capitalize">{c.payment_model.replace(/_/g, ' ')}</span>}
                    />
                  )}
                  {c.budget != null && (
                    <>
                      <SideRow
                        label="Total budget"
                        children={
                          <span className="font-semibold text-[#4ade80]">
                            ${c.budget.toLocaleString()}
                          </span>
                        }
                      />
                      <SideRow
                        label={`nx8up fee (${Math.round(NX_FEE_RATE * 100)}%)`}
                        children={
                          <span className="text-red-400/80">−${fee.toLocaleString()}</span>
                        }
                      />
                      <SideRow
                        label="Creator pool"
                        children={
                          <span className="font-semibold text-[#4ade80]">
                            ${creatorPool.toLocaleString()}
                          </span>
                        }
                      />
                      {perCreator && (
                        <SideRow
                          label="Per creator"
                          children={
                            <span className="text-[#4ade80]">≈ ${perCreator.toLocaleString()}</span>
                          }
                        />
                      )}
                    </>
                  )}
                  {c.end_date && (
                    <SideRow label="Deadline" children={new Date(c.end_date).toLocaleDateString()} />
                  )}
                </div>
              </NxHudCard>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
