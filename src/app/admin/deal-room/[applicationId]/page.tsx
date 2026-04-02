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
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/admin/deal-room"
          className="inline-flex items-center gap-1.5 text-xs dash-text-muted hover:text-[#c8dff0] transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Queue
        </Link>

        {/* Header */}
        <div className="dash-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/20 text-[#a855f7]">Deal Room</span>
                {isPendingReview && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Awaiting Admin Review</span>
                )}
                {sub.status === 'admin_verified' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/20 text-[#00c8ff]">Admin Verified</span>
                )}
                {sub.status === 'admin_rejected' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Admin Rejected</span>
                )}
              </div>
              <h1 className="text-xl font-bold dash-text-bright">{c.title}</h1>
              <p className="text-sm dash-text-muted mt-0.5">
                Creator: <span className="dash-accent">{handle}</span>
                {' · '}
                Sponsor: <span className="dash-text">{c.sponsor.company_name ?? 'Unknown'}</span>
              </p>
            </div>
            {c.end_date && (
              <p className="text-xs dash-text-muted">
                Campaign deadline: {new Date(c.end_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Submission Details */}
        <div className="dash-panel p-5">
          <h2 className="dash-panel-title mb-4">Creator Submission</h2>
          <dl className="space-y-4">
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
                  <a
                    href={sub.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm dash-accent hover:underline break-all"
                  >
                    {sub.screenshot_url}
                  </a>
                </dd>
              </div>
            )}
            {sub.posted_at && (
              <div>
                <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Content posted at</dt>
                <dd className="text-sm dash-text-bright">{new Date(sub.posted_at).toLocaleString()}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Disclosure confirmed</dt>
              <dd className={`text-sm font-medium ${sub.disclosure_confirmed ? 'text-green-400' : 'text-red-400'}`}>
                {sub.disclosure_confirmed ? 'Yes' : 'No'}
              </dd>
            </div>
            {sub.submitted_at && (
              <div>
                <dt className="text-xs dash-text-muted uppercase tracking-wide mb-0.5">Submitted at</dt>
                <dd className="text-sm dash-text-muted">{new Date(sub.submitted_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Campaign requirements for reference */}
        <div className="dash-panel p-5">
          <h2 className="dash-panel-title mb-4">Campaign Requirements</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
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
          </dl>
          <dl className="space-y-2 text-sm">
            {c.brand_name && (
              <div className="flex gap-2"><dt className="dash-text-muted w-24 shrink-0">Brand</dt><dd className="dash-text-bright">{c.brand_name}</dd></div>
            )}
            {c.content_guidelines && (
              <div><dt className="dash-text-muted mb-0.5">Guidelines</dt><dd className="dash-text whitespace-pre-line">{c.content_guidelines}</dd></div>
            )}
            {c.video_includes.length > 0 && (
              <div>
                <dt className="dash-text-muted mb-1">Must include</dt>
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
        </div>

        {/* Admin Review */}
        {isPendingReview && (
          <div className="dash-panel p-5">
            <h2 className="dash-panel-title mb-4">Admin Decision</h2>
            <AdminReviewButtons applicationId={applicationId} />
          </div>
        )}

        {!isPendingReview && (
          <div className={`dash-panel p-4 border ${sub.status === 'admin_verified' ? 'border-[#00c8ff]/30' : 'border-red-500/20'}`}>
            <p className={`text-sm font-semibold ${sub.status === 'admin_verified' ? 'text-[#00c8ff]' : 'text-red-400'}`}>
              {sub.status === 'admin_verified' ? 'Approved — forwarded to sponsor for review.' : 'Rejected — creator has been notified.'}
            </p>
            {sub.sponsor_notes && (
              <p className="text-xs dash-text-muted mt-1">{sub.sponsor_notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
