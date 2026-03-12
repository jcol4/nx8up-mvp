import Link from 'next/link'
import { getOpenCampaigns } from './_actions'
import Panel from '@/components/shared/Panel'

export default async function CreatorCampaignsPage() {
  const campaigns = await getOpenCampaigns(10)

  return (
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-6">
        <Link href="/creator" className="text-xs cr-accent hover:underline">← Back to Dashboard</Link>
        <h1 className="text-xl font-semibold cr-text-bright mt-2">Open Campaigns</h1>
        <p className="text-sm cr-text-muted mt-1">Browse and apply to sponsor campaigns.</p>
      </div>

      {campaigns.length === 0 ? (
        <Panel variant="creator">
          <p className="text-sm cr-text-muted text-center py-8">No open campaigns right now. Check back soon!</p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {campaigns.map((c: (typeof campaigns)[number]) => (
            <li key={c.id}>
              <Link
                href={`/creator/campaigns/${c.id}`}
                className="block p-4 rounded-lg cr-border border cr-bg-inner hover:border-[rgba(0,200,255,0.3)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold cr-text-bright">{c.title}</span>
                    <p className="text-xs cr-text-muted mt-0.5">
                      {c.sponsor.company_name ?? 'Sponsor'} ·{' '}
                      {c.platform.join(', ')}
                      {c.deadline ? ` · Deadline: ${new Date(c.deadline).toLocaleDateString()}` : ''}
                    </p>
                    {c.description && (
                      <p className="text-xs cr-text mt-1 line-clamp-2">{c.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.game_category.slice(0, 3).map((g: string) => (
                        <span key={g} className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/10 text-[#00c8ff]">{g}</span>
                      ))}
                      {c.content_type.slice(0, 2).map((t: string) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {c.budget != null && (
                      <span className="text-sm font-bold cr-success">${c.budget.toLocaleString()}</span>
                    )}
                    <p className="text-xs cr-text-muted mt-0.5">{c._count.applications} applied</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}