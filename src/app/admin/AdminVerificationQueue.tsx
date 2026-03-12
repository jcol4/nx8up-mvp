import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'

const QUEUE_ITEMS = [
  { username: 'John' },
  { username: 'Ava' },
  { username: 'Marcos' },
  { username: 'David' },
]

export default function AdminVerificationQueue() {
  return (
    <DashboardPanel title="Verification Queue" href="/admin/creators" linkLabel="View all">
      <div className="relative rounded-lg overflow-hidden dash-border border dash-bg-inner max-h-[280px] overflow-y-auto">
        {/* Background image on right */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop)',
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
        {/* Vertical list */}
        <div className="relative z-10 divide-y divide-white/10">
          {QUEUE_ITEMS.map((item, i) => (
            <Link
              key={i}
              href="/admin/creators"
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
            >
              <span className="flex-1 text-sm font-medium dash-text-bright">{item.username}</span>
              <span className="text-xs dash-text-muted">Proof Submitted</span>
              <span className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </DashboardPanel>
  )
}
