import Link from 'next/link'
import { DashboardPanel, CardWithImage } from '@/components/dashboard'

const MISSIONS = [
  { title: 'Valorant Challenge', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop' },
  { title: 'New RPG Launch', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop' },
  { title: 'Tech Gadget Promo', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=250&fit=crop' },
]

export default function AdminActiveMissions() {
  return (
    <DashboardPanel title="Active Missions" href="/admin/missions" linkLabel="View all">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
        {MISSIONS.map((m, i) => (
          <CardWithImage
            key={i}
            title={m.title}
            imageUrl={m.imageUrl}
            href="/admin/missions"
            className="flex-shrink-0 w-[140px]"
            cornerBadge={
              <span className="w-6 h-6 rounded-full bg-[#22c55e]/90 flex items-center justify-center text-white text-xs">
                ✓
              </span>
            }
          />
        ))}
        <Link
          href="/admin/missions/new"
          className="flex-shrink-0 w-[140px] min-h-[100px] dash-border border border-dashed rounded-lg flex items-center justify-center dash-text-muted hover:dash-accent hover:border-[#00c8ff]/30 transition-colors"
        >
          <span className="text-3xl">+</span>
        </Link>
      </div>
    </DashboardPanel>
  )
}
