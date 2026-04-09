import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../../SponsorHeader'
import NewCampaignForm from './NewCampaignForm'
import { EMPTY_DRAFT, type CampaignDraft } from './_shared'
import { getMissingSponsorProfileFields } from '@/lib/sponsor-profile'

export default async function NewCampaignPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: {
      company_name: true,
      location: true,
      language: true,
      platform: true,
      content_type: true,
      budget_min: true,
      budget_max: true,
      min_subs_followers: true,
      min_engagement_rate: true,
      age_restriction_type: true,
      preferred_payment_method: true,
    },
  })

  const missingFields = getMissingSponsorProfileFields(sponsor ?? {})

  const availableCreators = await prisma.content_creators.findMany({
    where: { is_available: true },
    select: {
      id: true,
      twitch_username: true,
      youtube_handle: true,
      youtube_channel_name: true,
      platform: true,
      subs_followers: true,
      youtube_subscribers: true,
      creator_size: true,
    },
    orderBy: { subs_followers: 'desc' },
    take: 200,
  })
  if (missingFields.length > 0) {
    return (
      <>
        <SponsorHeader />
        <div className="flex-1 p-6 sm:p-8 overflow-auto">
          <div className="max-w-xl mx-auto">
            <div className="dash-panel p-6 space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <div>
                  <h1 className="text-base font-semibold dash-text-bright mb-1">Complete your profile first</h1>
                  <p className="text-sm dash-text-muted">
                    You must fill out all required profile fields before posting a campaign.
                  </p>
                </div>
              </div>
              <ul className="space-y-1.5 pl-2">
                {missingFields.map(f => (
                  <li key={f.label} className="text-xs dash-text-muted">
                    · <span className="text-yellow-400/80 font-medium">{f.label}</span> — {f.description}
                  </li>
                ))}
              </ul>
              <Link
                href="/sponsor/profile"
                className="inline-block py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Go to profile
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  const profileDraft: CampaignDraft = {
    ...EMPTY_DRAFT,
    brand_name:               sponsor?.company_name ?? '',
    platform:                 sponsor?.platform ?? [],
    min_subs_followers:       sponsor?.min_subs_followers?.toString() ?? '',
    min_engagement_rate:      sponsor?.min_engagement_rate != null
                                ? Number(sponsor.min_engagement_rate).toFixed(2)
                                : '',
    preferred_payment_method: sponsor?.preferred_payment_method ?? 'card',
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
          <NewCampaignForm
            initialDraft={profileDraft}
            sponsorAgeRestriction={sponsor?.age_restriction_type ?? null}
            availableCreators={availableCreators}
          />
        </div>
      </div>
    </>
  )
}
