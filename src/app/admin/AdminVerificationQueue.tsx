import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DashboardPanel } from '@/components/dashboard'

export default async function AdminVerificationQueue() {
  const pending = await prisma.deal_submissions.findMany({
    where: { status: 'submitted' },
    orderBy: { submitted_at: 'asc' },
    take: 5,
    include: {
      application: {
        include: {
          creator: { select: { twitch_username: true, youtube_channel_name: true } },
          campaign: { select: { title: true } },
        },
      },
    },
  })

  return (
    <DashboardPanel
      title="Verification Queue"
      href="/admin/deal-room"
      linkLabel={pending.length > 0 ? `View all (${pending.length})` : 'View'}
    >
      <div className="rounded-lg overflow-hidden dash-border border dash-bg-inner">
        {pending.length === 0 ? (
          <p className="text-sm dash-text-muted text-center py-6">No submissions pending review.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {pending.map((sub) => {
              const creator = sub.application.creator
              const handle =
                creator.twitch_username
                  ? `@${creator.twitch_username}`
                  : creator.youtube_channel_name
                    ? `@${creator.youtube_channel_name}`
                    : 'Creator'
              return (
                <Link
                  key={sub.application_id}
                  href={`/admin/deal-room/${sub.application_id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-text-bright truncate">{handle}</p>
                    <p className="text-xs dash-text-muted truncate">{sub.application.campaign.title}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 shrink-0">
                    Review
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardPanel>
  )
}
