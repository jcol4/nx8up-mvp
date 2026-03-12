import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Creators — nx8up Admin' }

export default async function AdminCreatorsPage() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const creators = await prisma.content_creators.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      _count: { select: { applications: true } },
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold dash-text-bright">Creators</h1>
          <p className="text-sm dash-text-muted mt-0.5">
            {creators.length} registered creator{creators.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {creators.length === 0 ? (
        <div className="dash-panel p-8 text-center">
          <p className="dash-text-muted text-sm">No creators registered yet.</p>
        </div>
      ) : (
        <div className="dash-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Creator</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Platforms</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Followers</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Avg VOD Views</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Location</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Applications</th>
                <th className="text-left px-4 py-3 dash-text-muted font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {creators.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                    i === creators.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="dash-text-bright font-medium">
                      {c.twitch_username ?? c.youtube_handle ?? (
                        <span className="dash-text-muted italic">No handle</span>
                      )}
                    </p>
                    <p className="text-xs dash-text-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.twitch_username && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-[#7b4fff]/10 text-[#7b4fff]">
                          Twitch
                        </span>
                      )}
                      {c.youtube_channel_id && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                          YouTube
                        </span>
                      )}
                      {!c.twitch_username && !c.youtube_channel_id && (
                        <span className="text-xs dash-text-muted italic">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {c.subs_followers != null
                      ? c.subs_followers.toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {c.average_vod_views != null
                      ? c.average_vod_views.toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 dash-text-muted">{c.location ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[#00c8ff] font-semibold">
                      {c._count.applications}
                    </span>
                  </td>
                  <td className="px-4 py-3 dash-text-muted">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/creators/${c.id}`}
                      className="text-xs text-[#00c8ff] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}