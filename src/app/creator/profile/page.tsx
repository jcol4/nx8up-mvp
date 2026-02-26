import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCreatorProfile } from './_actions'
import CreatorTopBar from '@/components/creator/CreatorTopBar'
import CreatorProfileForm from './CreatorProfileForm'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'

export default async function CreatorProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

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
        <div className="cr-panel">
          <h1 className="cr-panel-title">Creator Profile</h1>
          <p className="text-sm cr-text-muted mb-6">
            Manage your public profile. This info helps sponsors find and connect with you.
          </p>
          <CreatorProfileForm profile={profile} categoriesOptions={DEFAULT_CONTENT_CATEGORIES} />
        </div>
      </main>
    </>
  )
}
