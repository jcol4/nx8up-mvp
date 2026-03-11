import { auth } from '@clerk/nextjs/server'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import UserProfileBlock from '@/components/shared/UserProfileBlock'
import { prisma } from '@/lib/prisma'

type Props = {
  rightContent?: React.ReactNode
}

export default async function CreatorTopBar({ rightContent }: Props) {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const { displayName, username } = await getUserDisplayInfo()
  const userName = displayName || username || 'Creator'

  let applicationCount = 0
  let pendingCount = 0

  if (userId) {
    const creator = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: { id: true },
    })

    if (creator) {
      const [total, pending] = await Promise.all([
        prisma.campaign_applications.count({
          where: { creator_id: creator.id },
        }),
        prisma.campaign_applications.count({
          where: { creator_id: creator.id, status: 'pending' },
        }),
      ])
      applicationCount = total
      pendingCount = pending
    }
  }

  return (
    <header className="cr-topbar flex-shrink-0">
      <div className="flex items-center gap-6">
        <span className="text-sm cr-text-muted">
          Welcome, <span className="cr-text-bright font-semibold">{userName}!</span>
        </span>
        <div className="hidden md:flex items-center gap-4 text-xs cr-text-muted">
          <span>
            Campaigns applied:{' '}
            <span className="cr-accent font-semibold">{applicationCount}</span>
          </span>
          {pendingCount > 0 && (
            <span>
              Pending:{' '}
              <span className="cr-purple font-semibold">{pendingCount}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <UserProfileBlock
          displayName={displayName}
          username={username}
          variant="creator"
          editProfileLink="/creator/profile"
          role={role}
        />
        {rightContent}
      </div>
    </header>
  )
}