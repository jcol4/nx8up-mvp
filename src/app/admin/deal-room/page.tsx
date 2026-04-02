import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getAdminDealRoomQueue } from './_actions'

export default async function AdminDealRoomQueuePage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const queue = await getAdminDealRoomQueue()

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold dash-text-bright mb-1">Deal Room Queue</h1>
          <p className="dash-text-muted text-sm">
            Review creator submissions before they are forwarded to sponsors.
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="dash-panel p-8 text-center dash-text-muted">
            <p>No submissions pending review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((sub) => {
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
                  href={`/admin/deal-room/${sub.application_id}`}
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
        )}
      </div>
    </div>
  )
}
