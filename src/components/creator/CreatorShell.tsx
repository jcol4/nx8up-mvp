import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import { getRankName } from '@/lib/creator-xp'
import CreatorRouteShell from './CreatorRouteShell'

type Props = {
  children: React.ReactNode
}

export default async function CreatorShell({ children }: Props) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  const { displayName, username } = await getUserDisplayInfo()

  let statsRows: { label: string; value: string; valueClassName?: string }[] = []
  let statsUnavailable = false

  if (userId) {
    try {
      const [creator, clerkUser] = await Promise.all([
        prisma.content_creators.findUnique({
          where: { clerk_user_id: userId },
          select: {
            average_vod_views: true,
            twitch_username: true,
            youtube_channel_name: true,
          },
        }),
        (await clerkClient()).users.getUser(userId),
      ])
      const meta = (clerkUser.publicMetadata || {}) as Record<string, unknown>
      const level = Math.max(1, Number(meta.creatorLevel) || 1)
      const rankName = getRankName(level)
      statsRows = [
        {
          label: 'Level',
          value: `Lv. ${level} · ${rankName}`,
          valueClassName: 'font-medium text-[#00c8ff]',
        },
        {
          label: 'Avg VOD views',
          value: creator?.average_vod_views != null ? creator.average_vod_views.toLocaleString() : '—',
        },
        {
          label: 'Twitch',
          value: creator?.twitch_username ? `@${creator.twitch_username}` : 'Not linked',
          valueClassName: creator?.twitch_username ? 'font-medium text-[#7b4fff]' : 'italic text-slate-500',
        },
        {
          label: 'YouTube',
          value: creator?.youtube_channel_name ? `@${creator.youtube_channel_name}` : 'Not linked',
          valueClassName: creator?.youtube_channel_name ? 'font-medium text-[#ff4444]' : 'italic text-slate-500',
        },
      ]
    } catch {
      statsUnavailable = true
      statsRows = [
        { label: 'Level', value: '—' },
        { label: 'Avg VOD views', value: '—' },
        { label: 'Twitch', value: 'Not linked' },
        { label: 'YouTube', value: 'Not linked' },
      ]
    }
  }

  return (
    <CreatorRouteShell
      displayName={displayName}
      username={username}
      role={role}
      statsRows={statsRows}
      statsUnavailable={statsUnavailable}
    >
      {children}
    </CreatorRouteShell>
  )
}
