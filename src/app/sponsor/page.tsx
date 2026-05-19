import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  getSponsorGettingStartedCached,
  type SponsorGettingStartedData,
} from '@/lib/sponsor-dashboard-cache'
import {
  SponsorHeader,
  SponsorKpiRow,
  SponsorPostCampaignSection,
  SponsorMyCampaignsSection,
  SponsorMatchedCreatorsSection,
  SponsorGettingStartedCard,
} from './_components'

function SectionSkeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className ?? 'h-40'}`} />
}

export default async function SponsorDashboardPage() {
  const { userId } = await auth()

  let gettingStarted: SponsorGettingStartedData | null = null
  if (userId) {
    const sponsor = await prisma.sponsors.findUnique({
      where: { clerk_user_id: userId },
      select: { id: true },
    })
    if (sponsor) {
      gettingStarted = await getSponsorGettingStartedCached(sponsor.id)
    }
  }

  const showGettingStarted =
    gettingStarted &&
    !(
      gettingStarted.profileComplete &&
      gettingStarted.hasCampaign &&
      gettingStarted.hasApplications &&
      gettingStarted.hasPaidApplication
    )

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          {showGettingStarted && gettingStarted && (
            <SponsorGettingStartedCard {...gettingStarted} />
          )}
          <Suspense fallback={<SectionSkeleton className="h-32" />}>
            <SponsorKpiRow />
          </Suspense>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
