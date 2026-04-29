import { DashboardPanel, InsightRow } from '@/components/dashboard'

export default function AdminQuickInsights() {
  return (
    <DashboardPanel title="Quick Insights" href="/admin/reports" linkLabel="View all">
      <div className="mb-3 rounded-lg border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#a9abb5]">System Health</p>
        <p className="mt-1 text-sm dash-text-bright">Moderation throughput is healthy this week.</p>
      </div>
      <div className="space-y-0">
        <InsightRow
          label="25 Creators Verified"
          value="+12%"
          icon={
            <span className="w-5 h-5 rounded bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] text-xs">↑</span>
          }
        />
        <InsightRow
          label="7 Pending Payouts"
          value="$4,200"
          icon={
            <span className="w-5 h-5 rounded bg-[#7b4fff]/20 flex items-center justify-center text-[#7b4fff] text-xs">$</span>
          }
        />
        <InsightRow
          label="285K Views This Week"
          value="+8%"
          icon={
            <span className="w-5 h-5 rounded bg-[#7b4fff]/20 flex items-center justify-center text-[#7b4fff] text-xs">▶</span>
          }
        />
      </div>
    </DashboardPanel>
  )
}
