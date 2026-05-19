import { auth } from '@clerk/nextjs/server'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import { getCreatorSidebarStatsCached } from '@/lib/creator-sidebar-cache'
import type { SidebarStatRow } from '@/components/nx-shell/RoleSidebar'
import CreatorRouteShell from './CreatorRouteShell'

type Props = {
  children: React.ReactNode
}

function buildStatsRows(stats: Awaited<ReturnType<typeof getCreatorSidebarStatsCached>>): SidebarStatRow[] {
  return [
    {
      label: 'Level',
      value: `Lv. ${stats.level} · ${stats.rankName}`,
      valueClassName: 'font-medium text-[#00c8ff]',
    },
    {
      label: 'Avg VOD views',
      value: stats.averageVodViews != null ? stats.averageVodViews.toLocaleString() : '—',
    },
    {
      label: 'Twitch',
      value: stats.twitchUsername ? `@${stats.twitchUsername}` : 'Not linked',
      valueClassName: stats.twitchUsername ? 'font-medium text-[#7b4fff]' : 'italic text-white/75',
      valueHref: stats.twitchUsername ? undefined : '/creator/profile',
    },
    {
      label: 'YouTube',
      value: stats.youtubeChannelName ? `@${stats.youtubeChannelName}` : 'Not linked',
      valueClassName: stats.youtubeChannelName ? 'font-medium text-[#ff4444]' : 'italic text-white/75',
      valueHref: stats.youtubeChannelName ? undefined : '/creator/profile',
    },
  ]
}

const FALLBACK_STATS_ROWS: SidebarStatRow[] = [
  { label: 'Level', value: '—' },
  { label: 'Avg VOD views', value: '—' },
  { label: 'Twitch', value: 'Not linked', valueHref: '/creator/profile', valueClassName: 'italic text-white/75' },
  { label: 'YouTube', value: 'Not linked', valueHref: '/creator/profile', valueClassName: 'italic text-white/75' },
]

export default async function CreatorShell({ children }: Props) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  const { displayName, username } = await getUserDisplayInfo()

  let statsRows: SidebarStatRow[] = FALLBACK_STATS_ROWS
  let statsUnavailable = false

  if (userId) {
    try {
      const stats = await getCreatorSidebarStatsCached(userId)
      statsRows = buildStatsRows(stats)
    } catch {
      statsUnavailable = true
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
