import Link from 'next/link'
import { DashboardPanel, CardWithImage } from '@/components/dashboard'
import { LESSONS } from '@/lib/academy-lessons'

const LESSON_CARDS = [
  { title: 'Sponsorship Basics', imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=250&fit=crop' },
  { title: 'Optimize Your Content', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop' },
  { title: 'Mastering Social Media', imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop' },
]

export default function AdminCreatorAcademy() {
  return (
    <DashboardPanel title="Creator Academy" href="/admin/academy" linkLabel="View all">
      <div className="flex items-center gap-3 mb-4">
        <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#eab308] to-[#f59e0b] text-black text-sm font-bold flex items-center gap-2">
          <span>⭐</span> Lvl 3 Rising Star
        </div>
        <Link href="/admin/academy" className="text-xs dash-accent hover:underline">
          Complete 3 More Lessons →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
        {LESSON_CARDS.map((item, i) => (
          <CardWithImage
            key={i}
            title={item.title}
            imageUrl={item.imageUrl}
            href="/admin/academy"
            className="flex-shrink-0 w-[140px]"
            cornerBadge={
              <span className="w-7 h-7 rounded-full bg-[#7b4fff]/90 flex items-center justify-center text-white text-xs">
                ▶
              </span>
            }
          />
        ))}
      </div>
      <div className="flex gap-2 mt-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-xs font-medium">
          ✓ Goal Reached! 500 Followers
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7b4fff]/10 border border-[#7b4fff]/20 text-[#7b4fff] text-xs font-medium">
          ✓ 1st Mission Completed
        </span>
      </div>
    </DashboardPanel>
  )
}
