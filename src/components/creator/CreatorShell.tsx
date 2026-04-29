import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
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
      const creator = await prisma.content_creators.findUnique({
        where: { clerk_user_id: userId },
        select: {
          subs_followers: true,
          average_vod_views: true,
          twitch_username: true,
          youtube_channel_name: true,
        },
      })
      statsRows = [
        {
          label: 'Twitch Followers',
          value: creator?.subs_followers != null ? creator.subs_followers.toLocaleString() : '—',
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
        { label: 'Twitch Followers', value: '—' },
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
