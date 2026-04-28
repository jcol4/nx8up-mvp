import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SponsorHeader from '../_components/dashboard/SponsorHeader'
import { getSponsorProfile } from './_actions'
import SponsorProfileForm from './SponsorProfileForm'

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

          <SponsorProfileForm profile={profile} />
        </div>
      </div>
    </>
  )
}
