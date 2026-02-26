import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'

const MOCK_MISSIONS = [
  { id: '1', title: 'Valorant Challenge', budget: '$300', categories: ['Gaming'], status: 'Active', applicants: 12 },
  { id: '2', title: 'Tech Gadget Unboxing', budget: '$250', categories: ['Vlogging', 'Tutorials / How-to'], status: 'Active', applicants: 8 },
  { id: '3', title: 'Stream Overlay Promo', budget: '$120', categories: ['Gaming'], status: 'Pending', applicants: 3 },
]

export default function SponsorMyMissionsSection() {
  return (
    <DashboardPanel title="My Missions" href="/sponsor/missions" linkLabel="View all">
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {MOCK_MISSIONS.map((m) => (
          <Link
            key={m.id}
            href={`/sponsor/missions/${m.id}`}
            className="block p-3 rounded-lg dash-border border dash-bg-inner hover:border-[#00c8ff]/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium dash-text-bright">{m.title}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  m.status === 'Active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#eab308]/20 text-[#eab308]'
                }`}
              >
                {m.status}
              </span>
            </div>
            <p className="text-xs dash-text-muted mt-0.5">
              {m.categories.join(' · ')} · {m.budget}
            </p>
            <p className="text-xs dash-accent mt-1">{m.applicants} applicants</p>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  )
}
