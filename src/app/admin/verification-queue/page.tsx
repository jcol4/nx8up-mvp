/**
 * Admin Verification Queue page (`/admin/verification-queue`).
 *
 * Two-tab review queue for admins:
 *
 * **Campaign Submissions tab** (default)
 *   Lists all `deal_submissions` with status `"submitted"` fetched via
 *   `getAdminDealRoomQueue`. Each row links to the individual review page at
 *   `/admin/verification-queue/[applicationId]`. Shows creator handle, campaign
 *   title, brand name, and submission date.
 *
 * **Profile Changes tab** (`?tab=profile-changes`)
 *   Lists all pending `sponsor_age_restriction_requests` fetched via
 *   `getAgeRestrictionChangeQueue`. Each row shows the sponsor name, current
 *   age restriction setting, and the requested change. Links to
 *   `/admin/sponsor-profile-changes/[id]`.
 *
 * Tab counts are shown as badge pills next to each tab label.
 *
 * External services: Clerk (auth), Prisma (via server actions in `_actions.ts`
 * and `sponsor-profile-changes/_actions.ts`).
 */
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
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-semibold dash-text-bright mb-1">Review Queue</h1>
          <p className="dash-text-muted text-sm">
            Review creator submissions and sponsor profile change requests.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-white/10">
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
            <div className="dash-panel p-8 text-center dash-text-muted">
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
                    className="flex items-center justify-between gap-3 p-4 dash-panel hover:border-[rgba(0,200,255,0.25)] transition-colors"
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
            <div className="dash-panel p-8 text-center dash-text-muted">
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
                    className="flex items-center justify-between gap-3 p-4 dash-panel hover:border-[rgba(0,200,255,0.25)] transition-colors"
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
