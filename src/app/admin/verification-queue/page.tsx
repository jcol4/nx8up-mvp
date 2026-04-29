import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getAdminDealRoomQueue } from './_actions'
import { getAgeRestrictionChangeQueue } from '../sponsor-profile-changes/_actions'

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminVerificationQueuePage({ searchParams }: Props) {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const { tab } = await searchParams
  const activeTab = tab === 'profile-changes' ? 'profile-changes' : 'submissions'

  const [submissionsQueue, profileChangesQueue] = await Promise.all([
    getAdminDealRoomQueue(),
    getAgeRestrictionChangeQueue(),
  ])

  return (
    <div className="flex-1 overflow-auto p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Review Queue</h1>
          <p className="mt-1 text-sm text-[#c4cad6]">
            Review creator submissions and sponsor profile change requests.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-1 flex gap-1 border-b border-white/10">
          <Link
            href="/admin/verification-queue"
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'submissions'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Campaign Submissions
            {submissionsQueue.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-[#00c8ff]/20 text-[#00c8ff]">
                {submissionsQueue.length}
              </span>
            )}
          </Link>
          <Link
            href="/admin/verification-queue?tab=profile-changes"
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'profile-changes'
                ? 'dash-text-bright border-b-2 border-[#00c8ff] -mb-px'
                : 'dash-text-muted hover:dash-text-bright'
            }`}
          >
            Profile Changes
            {profileChangesQueue.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                {profileChangesQueue.length}
              </span>
            )}
          </Link>
        </div>

        {/* Campaign Submissions tab */}
        {activeTab === 'submissions' && (
          submissionsQueue.length === 0 ? (
            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
              <p>No submissions pending review.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissionsQueue.map((sub) => {
                const app = sub.application
                const handle =
                  app.creator.twitch_username
                    ? `@${app.creator.twitch_username}`
                    : app.creator.youtube_channel_name
                      ? `@${app.creator.youtube_channel_name}`
                      : 'Creator'
                return (
                  <Link
                    key={sub.application_id}
                    href={`/admin/verification-queue/${sub.application_id}`}
                    className="glass-panel interactive-panel flex items-center justify-between gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm dash-text-bright font-medium">{app.campaign.title}</p>
                      <p className="text-xs dash-text-muted mt-0.5">
                        {handle}
                        {app.campaign.brand_name ? ` · ${app.campaign.brand_name}` : ''}
                        {app.campaign.end_date
                          ? ` · Deadline: ${new Date(app.campaign.end_date).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        Awaiting review
                      </span>
                      {sub.submitted_at && (
                        <span className="text-xs dash-text-muted">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-xs dash-text-muted">Review →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* Profile Changes tab */}
        {activeTab === 'profile-changes' && (
          profileChangesQueue.length === 0 ? (
            <div className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-8 text-center text-[#c4cad6]">
              <p>No pending age restriction change requests.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profileChangesQueue.map((req) => {
                const currentLabel = req.sponsor.age_restricted
                  ? (req.sponsor.age_restriction_type ?? 'Enabled')
                  : 'None'
                const requestedLabel = req.requested_age_restricted
                  ? (req.requested_age_restriction_type ?? 'Enabled')
                  : 'None'

                return (
                  <Link
                    key={req.id}
                    href={`/admin/sponsor-profile-changes/${req.id}`}
                    className="glass-panel interactive-panel flex items-center justify-between gap-3 rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm dash-text-bright font-medium">
                        {req.sponsor.company_name ?? req.sponsor.email}
                      </p>
                      <p className="text-xs dash-text-muted mt-0.5">
                        Age restriction: <span className="dash-text">{currentLabel}</span>
                        {' → '}
                        <span className={req.requested_age_restricted ? 'text-orange-400' : 'text-[#22c55e]'}>
                          {requestedLabel}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        Pending review
                      </span>
                      <span className="text-xs dash-text-muted">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs dash-text-muted">Review →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
