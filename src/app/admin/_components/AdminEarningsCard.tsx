import { DashboardPanel } from '@/components/dashboard'

export default function AdminEarningsCard() {
  return (
    <DashboardPanel title="Revenue Snapshot" href="/admin/reports" linkLabel="View reports">
      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#a9abb5]">This Month</p>
          <p className="mt-2 text-2xl font-semibold text-[#e8f4ff]">$12,350</p>
          <p className="mt-1 text-xs text-[#86efac]">+8.4% vs last month</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="dash-text-muted">Paid Out</span>
            <span className="dash-text-bright">$9,120</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5">
            <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-[#99f7ff] to-[#22c55e]" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="dash-text-muted">Pending</span>
            <span className="text-[#fcd34d]">$3,230</span>
          </div>
        </div>
      </div>
    </DashboardPanel>
  )
}
