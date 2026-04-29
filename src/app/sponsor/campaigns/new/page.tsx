import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import SponsorHeader from '../../_components/dashboard/SponsorHeader'
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
            <div className="glass-panel interactive-panel overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] neon-glow-teal">
              <div className="relative px-6 pt-6 pb-5">
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#99f7ff]/40 to-transparent"
                  aria-hidden
                />
                <div className="flex gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 shadow-[0_0_20px_-4px_rgba(251,191,36,0.35)]"
                    aria-hidden
                  >
                    <svg className="h-5 w-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h1 className="text-lg font-semibold tracking-tight text-[#e8f4ff]">Complete your profile first</h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#a9abb5]">
                      You must fill out all required profile fields before posting a campaign.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/15 px-3 py-3 sm:px-4">
                <ul className="max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
                  {missingFields.map((f) => (
                    <li
                      key={f.label}
                      className="flex gap-3 rounded-lg border border-white/5 bg-black/25 px-3 py-2.5 transition-colors hover:border-[#99f7ff]/15"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.45)]" aria-hidden />
                      <p className="min-w-0 text-xs leading-relaxed text-[#a9abb5]">
                        <span className="font-semibold text-amber-200/95">{f.label}</span>
                        {' — '}
                        {f.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/10 px-6 py-5">
                <Link
                  href="/sponsor/profile"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#99f7ff] px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_0_24px_-6px_rgba(153,247,255,0.55)] transition hover:opacity-95 sm:w-auto"
                >
                  Go to profile
                </Link>
              </div>
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
          <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">New campaign</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Post a Campaign</h1>
            <p className="text-[#a9abb5] text-sm mt-1">
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
