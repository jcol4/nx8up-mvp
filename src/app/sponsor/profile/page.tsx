import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSponsorProfile } from './_actions'
import SponsorProfileForm from './SponsorProfileForm'

export default async function SponsorProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'sponsor' && role !== 'admin') redirect('/')

  const profile = await getSponsorProfile()

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold dash-text-bright">Sponsor Profile</h1>
            <p className="text-sm dash-text-muted mt-0.5">
              Manage your company info, campaign preferences, and creator requirements.
            </p>
          </div>
          <Link
            href="/sponsor"
            className="text-sm dash-text-muted hover:text-[#c8dff0] transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Form card */}
        <div className="dash-panel p-6">
          <SponsorProfileForm profile={profile} />
        </div>
      </div>
    </div>
  )
}
