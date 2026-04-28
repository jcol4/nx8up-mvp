import { Suspense } from 'react'
import AdminKpiRow from './_components/AdminKpiRow'
import AdminActiveCampaigns from './_components/AdminActiveCampaigns'
import AdminVerificationQueue from './_components/AdminVerificationQueue'
import AdminCreatorAcademy from './_components/AdminCreatorAcademy'
import AdminEarningsCard from './_components/AdminEarningsCard'

function SectionSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className ?? 'h-40'}`} />
}

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#99f7ff]">Admin Center</p>
          <h1 className="mt-1 font-headline text-2xl font-semibold text-[#e8f4ff]">Platform Operations Overview</h1>
        </div>

        <Suspense fallback={<SectionSkeleton className="h-32" />}>
          <AdminKpiRow />
        </Suspense>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Suspense fallback={<SectionSkeleton className="h-80" />}>
              <AdminActiveCampaigns />
            </Suspense>
          </div>
          <Suspense fallback={<SectionSkeleton className="h-80" />}>
            <AdminVerificationQueue />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AdminCreatorAcademy />
          <AdminEarningsCard />
        </div>
      </div>
    </div>
  )
}