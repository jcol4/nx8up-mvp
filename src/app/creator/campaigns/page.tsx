import Link from 'next/link'
import { getOpenCampaignsWithEligibility } from './_actions'
import Panel from '@/components/shared/Panel'

export default async function CreatorCampaignsPage() {
  const allEntries = await getOpenCampaignsWithEligibility(50)
  const entries = allEntries.filter((e) => e.eligible).sort((a, b) => b.score - a.score)

  return (
    <main className="max-w-4xl mx-auto p-6 sm:p-8">
      <div className="mb-6">
        <Link href="/creator" className="text-xs cr-accent hover:underline">← Back to Dashboard</Link>
        <h1 className="text-xl font-semibold cr-text-bright mt-2">Open Campaigns</h1>
        <p className="text-sm cr-text-muted mt-1">Browse and apply to sponsor campaigns.</p>
      </div>

      {entries.length === 0 ? (
        <Panel variant="creator">
          <p className="text-sm cr-text-muted text-center py-8">No open campaigns right now. Check back soon!</p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {entries.map(({ campaign: c, score }) => (
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
                      {c.end_date ? ` · Ends: ${new Date(c.end_date).toLocaleDateString()}` : ''}
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
                    <p className={`text-xs font-medium mt-1 ${
                      score >= 75 ? 'text-green-400' : score >= 45 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {score}% match
                    </p>
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
