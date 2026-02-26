import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'

const MOCK_CREATORS = [
  { username: 'John', categories: ['Gaming'], followers: '12K', matchScore: 95 },
  { username: 'Ava', categories: ['Vlogging', 'Tutorials / How-to'], followers: '8K', matchScore: 88 },
  { username: 'Marcos', categories: ['Gaming', 'Reactions'], followers: '24K', matchScore: 92 },
]

export default function SponsorMatchedCreatorsSection() {
  return (
    <DashboardPanel title="Matched Creators" href="/sponsor/creators" linkLabel="Browse all">
      <p className="text-xs dash-text-muted mb-3">
        Creators who match your mission targeting criteria.
      </p>
      <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
        {MOCK_CREATORS.map((c) => (
          <Link
            key={c.username}
            href="/sponsor/creators"
            className="flex items-center justify-between gap-3 p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#00c8ff]/30 transition-colors"
          >
            <div>
              <span className="text-sm font-medium dash-text-bright">{c.username}</span>
              <p className="text-xs dash-text-muted mt-0.5">{c.categories.join(' · ')} · {c.followers}</p>
            </div>
            <span className="text-xs dash-accent font-semibold">{c.matchScore}% match</span>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  )
}
