import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCreatorProfile } from './_actions'
import CreatorTopBar from '@/components/creator/CreatorTopBar'
import CreatorProfileForm from './CreatorProfileForm'
import Panel from '@/components/shared/Panel'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'

export default async function CreatorProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'creator' && role !== 'admin') redirect('/')

  const profile = await getCreatorProfile()

  return (
    <>
      <CreatorTopBar
        rightContent={
          <Link
            href="/creator"
            className="text-sm cr-text-muted hover:text-[#c8dff0] transition-colors"
          >
            ← Dashboard
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto p-6 sm:p-8">
        <Panel variant="creator" as="div" title="Creator Profile" titleLevel={1}>
          <p className="text-sm cr-text-muted mb-6">
            Manage your public profile. This info helps sponsors find and connect with you.
          </p>
          <CreatorProfileForm profile={profile} categoriesOptions={DEFAULT_CONTENT_CATEGORIES} />
        </Panel>
      </main>
    </>
  )
}
