import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getSponsorProfile } from './_actions'
import SponsorProfileForm from './SponsorProfileForm'
import DeleteAccountSection from './DeleteAccountSection'
import { TIER_LABELS, TIER_DESCRIPTIONS } from '@/lib/reputation'
import type { ReputationTier } from '@/lib/reputation'

export default async function SponsorProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'sponsor' && role !== 'admin') redirect('/')

  const profile = await getSponsorProfile()

  return (
    <>
      <SponsorHeader />
      <div className="flex-1 overflow-auto p-6 sm:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Sponsor</p>
              <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Sponsor Profile</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#a9abb5]">
                Manage your company info, campaign preferences, and creator requirements.
              </p>
            </div>
            <Link
              href="/sponsor"
              className="shrink-0 text-sm text-[#a9abb5] transition-colors hover:text-[#99f7ff]"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Reputation tier badge */}
          {profile && (() => {
            const tier = (profile.reputation_tier ?? 'neutral') as ReputationTier
            const tierColors: Record<ReputationTier, string> = {
              sanctioned: 'border-red-500/30 bg-red-500/10 text-red-400',
              restricted: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
              neutral:    'border-white/15 bg-white/5 text-[#a9abb5]',
              trusted:    'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#4ade80]',
              verified:   'border-[#99f7ff]/30 bg-[#99f7ff]/10 text-[#99f7ff]',
            }
            return (
              <div className={`flex items-start gap-3 rounded-xl border p-4 ${tierColors[tier]}`}>
                <div className="mt-0.5 shrink-0">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{TIER_LABELS[tier]} Sponsor</p>
                  <p className="mt-0.5 text-xs opacity-80">{TIER_DESCRIPTIONS[tier]}</p>
                </div>
              </div>
            )
          })()}

          <SponsorProfileForm profile={profile} />
          <DeleteAccountSection />
        </div>
      </div>
    </>
  )
}
