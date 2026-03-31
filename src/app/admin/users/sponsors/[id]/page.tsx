import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Sponsor Detail — nx8up Admin' }

type Props = { params: Promise<{ id: string }> }

export default async function AdminSponsorDetailPage({ params }: Props) {
  const { id } = await params
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'admin') redirect('/')

  const sponsor = await prisma.sponsors.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { created_at: 'desc' },
        include: { _count: { select: { applications: true } } },
      },
    },
  })

  if (!sponsor) notFound()

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm dash-text-muted hover:dash-text-bright transition-colors">
          ← Users
        </Link>
      </div>

      {/* Profile */}
      <div className="dash-panel p-5 space-y-4">
        <h1 className="text-xl font-semibold dash-text-bright">
          {sponsor.company_name ?? 'Unnamed Sponsor'}
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="dash-text-muted mb-0.5">Email</p>
            <p className="dash-text-bright">{sponsor.email}</p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Location</p>
            <p className="dash-text-bright">{sponsor.location ?? '—'}</p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Budget range</p>
            <p className="dash-text-bright">
              {sponsor.budget_min != null && sponsor.budget_max != null
                ? `$${sponsor.budget_min.toLocaleString()} – $${sponsor.budget_max.toLocaleString()}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="dash-text-muted mb-0.5">Joined</p>
            <p className="dash-text-bright">
              {sponsor.created_at
                ? new Date(sponsor.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>

        {sponsor.platform?.length > 0 && (
          <div>
            <p className="text-xs dash-text-muted mb-1.5">Target platforms</p>
            <div className="flex flex-wrap gap-1.5">
              {sponsor.platform.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded text-xs bg-[#00c8ff]/10 text-[#00c8ff]">{p}</span>
              ))}
            </div>
          </div>
        )}

        {sponsor.game_category?.length > 0 && (
          <div>
            <p className="text-xs dash-text-muted mb-1.5">Game categories</p>
            <div className="flex flex-wrap gap-1.5">
              {sponsor.game_category.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded text-xs bg-[#7b4fff]/10 text-[#7b4fff]">{g}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaigns */}
      <div>
        <h2 className="text-base font-semibold dash-text-bright mb-3">
          Campaigns ({sponsor.campaigns.length})
        </h2>
        {sponsor.campaigns.length === 0 ? (
          <div className="dash-panel p-6 text-center">
            <p className="dash-text-muted text-sm">No campaigns yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sponsor.campaigns.map((c) => (
              <div key={c.id} className="dash-panel p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="dash-text-bright font-medium truncate">{c.title}</p>
                  <p className="text-xs dash-text-muted mt-0.5">
                    {c._count.applications} applicant{c._count.applications !== 1 ? 's' : ''} ·{' '}
                    {c.end_date
                      ? `Ends ${new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : 'No end date'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    c.status === 'live'      ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                    c.status === 'draft'     ? 'bg-[#94a3b8]/20 text-[#94a3b8]' :
                    c.status === 'cancelled' ? 'bg-[#f87171]/20 text-[#f87171]' :
                                              'bg-[#eab308]/20 text-[#eab308]'
                  }`}>
                    {c.status}
                  </span>
                  <Link href={`/admin/campaigns/${c.id}`} className="text-xs text-[#00c8ff] hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
