import { auth } from '@clerk/nextjs/server'
import { getTranslations, getFormatter } from 'next-intl/server'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import { getCreatorSidebarStatsCached } from '@/lib/creator-sidebar-cache'
import type { SidebarStatRow } from '@/components/nx-shell/RoleSidebar'
import CreatorRouteShell from './CreatorRouteShell'

type Props = {
  children: React.ReactNode
}

export default async function CreatorShell({ children }: Props) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  const t = await getTranslations('nav')
  const format = await getFormatter()

  const notLinked = t('notLinked')
  const buildStatsRows = (stats: Awaited<ReturnType<typeof getCreatorSidebarStatsCached>>): SidebarStatRow[] => [
    {
      label: t('statLevel'),
      value: t('levelValue', { level: stats.level, rank: stats.rankName }),
      valueClassName: 'font-medium text-[#00c8ff]',
    },
    {
      label: t('statAvgVodViews'),
      value: stats.averageVodViews != null ? format.number(stats.averageVodViews) : '—',
    },
    {
      label: 'Twitch',
      value: stats.twitchUsername ? `@${stats.twitchUsername}` : notLinked,
      valueClassName: stats.twitchUsername ? 'font-medium text-[#7b4fff]' : 'italic text-white/75',
      valueHref: stats.twitchUsername ? undefined : '/creator/profile',
    },
    {
      label: 'YouTube',
      value: stats.youtubeChannelName ? `@${stats.youtubeChannelName}` : notLinked,
      valueClassName: stats.youtubeChannelName ? 'font-medium text-[#ff4444]' : 'italic text-white/75',
      valueHref: stats.youtubeChannelName ? undefined : '/creator/profile',
    },
  ]

  const fallbackStatsRows: SidebarStatRow[] = [
    { label: t('statLevel'), value: '—' },
    { label: t('statAvgVodViews'), value: '—' },
    { label: 'Twitch', value: notLinked, valueHref: '/creator/profile', valueClassName: 'italic text-white/75' },
    { label: 'YouTube', value: notLinked, valueHref: '/creator/profile', valueClassName: 'italic text-white/75' },
  ]

  const [{ displayName, username }, statsResult] = await Promise.all([
    getUserDisplayInfo(),
    userId
      ? getCreatorSidebarStatsCached(userId)
          .then((stats) => ({ ok: true as const, stats }))
          .catch(() => ({ ok: false as const }))
      : Promise.resolve({ ok: false as const }),
  ])

  let statsRows: SidebarStatRow[] = fallbackStatsRows
  let statsUnavailable = false
  if (statsResult.ok) {
    statsRows = buildStatsRows(statsResult.stats)
  } else if (userId) {
    statsUnavailable = true
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
