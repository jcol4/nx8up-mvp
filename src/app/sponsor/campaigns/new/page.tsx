import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../../SponsorHeader'
import NewCampaignForm from './NewCampaignForm'
import { EMPTY_DRAFT, type CampaignDraft } from './_shared'

export default async function NewCampaignPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: {
      company_name: true,
      platform: true,
      budget_min: true,
      budget_max: true,
      min_subs_followers: true,
      min_engagement_rate: true,
    },
  })

  const profileDraft: CampaignDraft = {
    ...EMPTY_DRAFT,
    brand_name:          sponsor?.company_name ?? '',
    platform:            sponsor?.platform ?? [],
    min_subs_followers:  sponsor?.min_subs_followers?.toString() ?? '',
    min_engagement_rate: sponsor?.min_engagement_rate != null
                           ? Number(sponsor.min_engagement_rate).toFixed(2)
                           : '',
    budget: (() => {
      const lo = sponsor?.budget_min
      const hi = sponsor?.budget_max
      if (lo != null && hi != null) return String(Math.round((lo + hi) / 2))
      if (lo != null) return String(lo)
      if (hi != null) return String(hi)
      return ''
    })(),
  }

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 p-6 sm:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-semibold dash-text-bright">Post a Campaign</h1>
            <p className="dash-text-muted text-sm mt-1">
              Walk through the setup steps to create a campaign creators can apply to.
            </p>
          </div>
          <NewCampaignForm initialDraft={profileDraft} />
        </div>
      </div>
    </>
  )
}
