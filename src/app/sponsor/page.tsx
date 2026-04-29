import { Suspense } from 'react'
import {
  SponsorHeader,
  SponsorKpiRow,
  SponsorPostCampaignSection,
  SponsorMyCampaignsSection,
  SponsorMatchedCreatorsSection,
} from './_components'

function SectionSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className ?? 'h-40'}`} />
}

export default function SponsorDashboardPage() {
  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <Suspense fallback={<SectionSkeleton className="h-32" />}>
            <SponsorKpiRow />
          </Suspense>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <SponsorPostCampaignSection />
            </div>

            <Suspense fallback={<SectionSkeleton className="h-72" />}>
              <SponsorMyCampaignsSection />
            </Suspense>
            <SponsorMatchedCreatorsSection />
          </div>
        </div>
      </div>
    </>
  )
}
