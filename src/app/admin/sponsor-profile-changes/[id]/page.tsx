import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getAgeRestrictionChangeRequest } from '../_actions'
import ReviewButtons from './ReviewButtons'

export default async function SponsorProfileChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const request = await getAgeRestrictionChangeRequest(id)
  if (!request) notFound()

  const currentLabel = request.sponsor.age_restricted
    ? (request.sponsor.age_restriction_type ?? 'Enabled (no type)')
    : 'No restriction'
  const requestedLabel = request.requested_age_restricted
    ? (request.requested_age_restriction_type ?? 'Enabled (no type)')
    : 'No restriction'

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-[#22c55e]/20 text-[#22c55e]',
    denied: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href="/admin/sponsor-profile-changes"
          className="inline-flex items-center gap-1.5 text-xs dash-text-muted hover:dash-text-bright transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to queue
        </Link>

        <div className="dash-panel p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold dash-text-bright">Age Restriction Change Request</h1>
              <p className="text-xs dash-text-muted mt-0.5">
                Submitted {new Date(request.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${statusColors[request.status] ?? ''}`}>
              {request.status}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-2 border-t border-white/10">
            <div>
              <dt className="text-[11px] dash-text-muted uppercase tracking-wide mb-0.5">Sponsor</dt>
              <dd className="text-sm dash-text-bright font-medium">
                {request.sponsor.company_name ?? request.sponsor.email}
              </dd>
              {request.sponsor.company_name && (
                <dd className="text-xs dash-text-muted">{request.sponsor.email}</dd>
              )}
            </div>

            <div>
              <dt className="text-[11px] dash-text-muted uppercase tracking-wide mb-0.5">Current Setting</dt>
              <dd className="text-sm dash-text">{currentLabel}</dd>
            </div>

            <div>
              <dt className="text-[11px] dash-text-muted uppercase tracking-wide mb-0.5">Requested Change</dt>
              <dd className={`text-sm font-semibold ${request.requested_age_restricted ? 'text-orange-400' : 'text-[#22c55e]'}`}>
                {requestedLabel}
              </dd>
            </div>
          </dl>
        </div>

        <div className="dash-panel p-5">
          <h2 className="text-sm font-semibold dash-text-bright mb-2">Sponsor&apos;s Explanation</h2>
          <p className="text-sm dash-text leading-relaxed whitespace-pre-wrap">{request.sponsor_message}</p>
        </div>

        {request.status === 'pending' ? (
          <ReviewButtons requestId={request.id} />
        ) : (
          <div className="dash-panel p-5">
            <h2 className="text-sm font-semibold dash-text-bright mb-2">Decision</h2>
            <p className={`text-sm font-semibold capitalize mb-1 ${statusColors[request.status]?.split(' ')[1] ?? ''}`}>
              {request.status}
            </p>
            {request.admin_notes && (
              <p className="text-sm dash-text-muted leading-relaxed">{request.admin_notes}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
