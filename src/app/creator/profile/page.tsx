import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCreatorProfile, refreshTwitchDataIfStale } from './_actions'
import CreatorTopBar from '@/components/creator/CreatorTopBar'
import CreatorProfileForm from './CreatorProfileForm'
import Panel from '@/components/shared/Panel'
import TwitchConnect from '@/components/creator/TwitchConnect'
import { DEFAULT_CONTENT_CATEGORIES } from '@/lib/creator-profile'
import { prisma } from '@/lib/prisma'

export default async function CreatorProfilePage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== 'creator' && role !== 'admin') redirect('/')

  // Refresh stale Twitch data silently before render
  await refreshTwitchDataIfStale(userId)

  const [profile, creator] = await Promise.all([
    getCreatorProfile(),
    prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: {
        twitch_username: true,
        twitch_broadcaster_type: true,
        twitch_profile_image: true,
        twitch_description: true,
        twitch_synced_at: true,
      },
    }),
  ])

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

      <main className="max-w-3xl mx-auto p-6 sm:p-8 space-y-6">
        {/* Twitch connection */}
        <Panel variant="creator" as="div" title="Connected Accounts" titleLevel={2}>
          <TwitchConnect
            initial={{
              username: creator?.twitch_username ?? null,
              broadcaster_type: creator?.twitch_broadcaster_type ?? null,
              profile_image: creator?.twitch_profile_image ?? null,
              description: creator?.twitch_description ?? null,
              synced_at: creator?.twitch_synced_at ?? null,
            }}
          />
        </Panel>

        {/* Profile form */}
        <Panel variant="creator" as="div" title="Creator Profile" titleLevel={1}>
          <p className="text-sm cr-text-muted mb-6">
            Manage your public profile. This info helps sponsors find and connect with you.
          </p>
          <CreatorProfileForm
            profile={profile}
            categoriesOptions={DEFAULT_CONTENT_CATEGORIES}
          />
        </Panel>
      </main>
    </>
  )
}