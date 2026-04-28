import { auth } from '@clerk/nextjs/server'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import NxHudHeader from '@/components/nx-shell/NxHudHeader'

export default async function SponsorHeader() {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { displayName, username } = await getUserDisplayInfo()

  return (
    <NxHudHeader
      mode="sticky"
      displayName={displayName}
      username={username}
      role={role}
      profileHref="/sponsor/profile"
    />
  )
}
