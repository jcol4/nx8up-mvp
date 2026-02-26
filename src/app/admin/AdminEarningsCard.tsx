import { DashboardPanel } from '@/components/dashboard'

export default function AdminEarningsCard() {
  return (
    <DashboardPanel title="This Month's Earnings">
      <div
        className="relative flex flex-col justify-end min-h-[180px] rounded-lg overflow-hidden -mx-4 -mb-4 mt-2"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=300&fit=crop)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 p-4">
          <p className="text-xs dash-text-muted mb-1">This Month&apos;s Earnings:</p>
          <div className="flex items-center gap-2 text-xs dash-text-muted mb-2">
            <span>▶</span>
            <span>42 Hrs Played</span>
          </div>
          <p className="text-2xl font-bold dash-text-bright">$12,350</p>
        </div>
      </div>
    </DashboardPanel>
  )
}
