import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getAdminDealRoomSubmission } from '../_actions'
import AdminReviewButtons from './AdminReviewButtons'

const DELIVERABLE_LABELS: Record<string, string> = {
  gameplay_footage: 'Gameplay footage',
  facecam: 'Facecam',
  product_unboxing: 'Product unboxing',
  tutorial: 'Tutorial / how-to',
  review: 'Review',
  challenge: 'Challenge',
  sponsored_segment: 'Sponsored segment',
}

const STATUS_BADGE: Record<string, string> = {
  submitted:
    'rounded-full border border-[#eab308]/40 bg-[#eab308]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fde047]',
  admin_verified:
    'rounded-full border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#bffcff]',
  admin_rejected:
    'rounded-full border border-[#f87171]/40 bg-[#f87171]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fca5a5]',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="sp-app-stat-label mb-1">{label}</dt>
      <dd className="text-sm cr-text">{children}</dd>
    </div>
  )
}

function DeliverableTile({ count, label }: { count: number; label: string }) {
  return (
    <div className="sp-app-stat-panel rounded-lg px-3 py-3 text-center">
      <p className="font-headline text-xl font-semibold tabular-nums text-[#e8f4ff]">{count}</p>
      <p className="sp-app-stat-label mt-0.5">{label}</p>
    </div>
  )
}

export default async function AdminDealRoomDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>
}) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { applicationId } = await params
  const sub = await getAdminDealRoomSubmission(applicationId)
  if (!sub) notFound()

  const app = sub.application
  const c = app.campaign
  const creator = app.creator

  const handle =
    creator.twitch_username
      ? `@${creator.twitch_username}`
      : creator.youtube_channel_name
        ? `@${creator.youtube_channel_name}`
        : 'Creator'

  const isPendingReview = sub.status === 'submitted'

  return (
    <div className="admin-verification-queue admin-verification-queue-detail mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <Link
        href="/admin/verification-queue"
        className="inline-flex items-center gap-2 rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#bffcff] transition hover:border-[#99f7ff]/50 hover:bg-[#99f7ff]/15"
      >
        <span aria-hidden>&larr;</span>
        Back to Queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-white/10 border-l-4 border-l-[#99f7ff]/45 bg-black/20 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#c084fc]/35 bg-[#c084fc]/10 px-2.5 py-0.5 text-xs font-semibold text-[#d8b4fe]">
              Deal room
            </span>
            {isPendingReview && (
              <span className={STATUS_BADGE.submitted}>Awaiting admin review</span>
            )}
            {sub.status === 'admin_verified' && (
              <span className={STATUS_BADGE.admin_verified}>Admin verified</span>
            )}
            {sub.status === 'admin_rejected' && (
              <span className={STATUS_BADGE.admin_rejected}>Admin rejected</span>
            )}
          </div>
          <p className="cr-field-label">Submission review</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">{c.title}</h1>
          <p className="mt-2 text-sm cr-text-muted">
            Creator: <span className="text-[#99f7ff]">{handle}</span>
            {' · '}
            Sponsor: <span className="cr-text">{c.sponsor.company_name ?? 'Unknown'}</span>
          </p>
        </div>
        {c.end_date && (
          <div className="sp-app-header-stat shrink-0 rounded-lg px-4 py-2.5 text-center">
            <p className="font-headline text-sm font-semibold tabular-nums text-[#e8f4ff]">
              {new Date(c.end_date).toLocaleDateString()}
            </p>
            <p className="sp-app-stat-label mt-0.5">Deadline</p>
          </div>
        )}
      </div>

      <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
        <h2 className="cr-panel-title mb-4">Creator submission</h2>
        <dl className="space-y-4">
          {sub.proof_urls.length > 0 && (
            <Field label={`Post URL${sub.proof_urls.length !== 1 ? 's' : ''}`}>
              <div className="space-y-1">
                {sub.proof_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-sm text-[#bffcff] hover:text-[#99f7ff] hover:underline"
                  >
                    {url}
                  </a>
                ))}
              </div>
            </Field>
          )}
          {sub.screenshot_url && (
            <Field label="Screenshot">
              <a
                href={sub.screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-[#bffcff] hover:text-[#99f7ff] hover:underline"
              >
                {sub.screenshot_url}
              </a>
            </Field>
          )}
          {sub.posted_at && (
            <Field label="Content posted at">
              {new Date(sub.posted_at).toLocaleString()}
            </Field>
          )}
          <Field label="Disclosure confirmed">
            <span
              className={
                sub.disclosure_confirmed ? 'font-semibold text-[#86efac]' : 'font-semibold text-[#fca5a5]'
              }
            >
              {sub.disclosure_confirmed ? 'Yes' : 'No'}
            </span>
          </Field>
          {sub.submitted_at && (
            <Field label="Submitted at">{new Date(sub.submitted_at).toLocaleString()}</Field>
          )}
        </dl>
      </section>

      <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
        <h2 className="cr-panel-title mb-4">Campaign requirements</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {c.num_videos ? <DeliverableTile count={c.num_videos} label={`Video${c.num_videos !== 1 ? 's' : ''}`} /> : null}
          {c.num_streams ? (
            <DeliverableTile count={c.num_streams} label={`Stream${c.num_streams !== 1 ? 's' : ''}`} />
          ) : null}
          {c.num_posts ? <DeliverableTile count={c.num_posts} label={`Post${c.num_posts !== 1 ? 's' : ''}`} /> : null}
          {c.num_short_videos ? (
            <DeliverableTile count={c.num_short_videos} label={`Short${c.num_short_videos !== 1 ? 's' : ''}`} />
          ) : null}
        </div>
        <dl className="space-y-3 text-sm">
          {c.brand_name && (
            <div className="flex gap-3">
              <dt className="sp-app-stat-label w-24 shrink-0">Brand</dt>
              <dd className="sp-app-stat-value">{c.brand_name}</dd>
            </div>
          )}
          {c.content_guidelines && (
            <div>
              <dt className="sp-app-stat-label mb-1">Guidelines</dt>
              <dd className="whitespace-pre-line cr-text-muted">{c.content_guidelines}</dd>
            </div>
          )}
          {c.video_includes.length > 0 && (
            <div>
              <dt className="sp-app-stat-label mb-1.5">Must include</dt>
              <dd className="flex flex-wrap gap-1.5">
                {c.video_includes.map((item: string) => (
                  <span
                    key={item}
                    className="rounded border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2 py-0.5 text-xs text-[#99f7ff]"
                  >
                    {DELIVERABLE_LABELS[item] ?? item}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {isPendingReview && (
        <section className="dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-5 sm:p-6">
          <h2 className="cr-panel-title mb-4">Admin decision</h2>
          <AdminReviewButtons applicationId={applicationId} />
        </section>
      )}

      {!isPendingReview && (
        <div
          className={`rounded-xl border p-4 ${
            sub.status === 'admin_verified'
              ? 'border-[#99f7ff]/30 bg-[#99f7ff]/8'
              : 'border-[#f87171]/30 bg-[#f87171]/8'
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              sub.status === 'admin_verified' ? 'text-[#bffcff]' : 'text-[#fca5a5]'
            }`}
          >
            {sub.status === 'admin_verified'
              ? 'Approved — forwarded to sponsor for review.'
              : 'Rejected — creator has been notified.'}
          </p>
          {sub.sponsor_notes && <p className="mt-1 text-xs cr-text-muted">{sub.sponsor_notes}</p>}
        </div>
      )}
    </div>
  )
}
