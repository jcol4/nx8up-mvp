'use client'

import UserProfileBlock from '@/components/shared/UserProfileBlock'
import NotificationBell from '@/components/shared/NotificationBell'

type NxHudHeaderProps = {
  displayName?: string | null
  username?: string | null
  role?: string
  profileHref: string
  collapsed?: boolean
  mode?: 'fixedWithSidebar' | 'sticky'
}

export default function NxHudHeader({
  displayName,
  username,
  role,
  profileHref,
  collapsed,
  mode = 'sticky',
}: NxHudHeaderProps) {
  const positionClass =
    mode === 'fixedWithSidebar'
      ? `fixed top-0 right-0 ${collapsed ? 'md:left-20' : 'md:left-64'}`
      : 'sticky top-0'

  return (
    <header
      className={`${positionClass} z-30 flex h-16 items-center justify-between border-b border-white/10 px-6 backdrop-blur-md shadow-[0_4px_12px_0_rgba(0,0,0,0.4)]`}
      style={{
        backgroundImage:
          'radial-gradient(ellipse 42% 160% at 50% 100%, rgba(72,90,114,0.62) 0%, rgba(48,60,79,0.44) 38%, rgba(22,28,40,0.18) 62%, rgba(14,18,28,0) 80%), linear-gradient(90deg, rgba(14,18,28,0.46) 0%, rgba(14,18,28,0.46) 35%, rgba(20,26,38,0.48) 50%, rgba(14,18,28,0.46) 65%, rgba(18,23,36,0.46) 100%)',
      }}
    >
      <div className="font-headline text-2xl font-bold tracking-tighter text-[#99f7ff] drop-shadow-[0_0_5px_rgba(153,247,255,0.25)]">
        NX8UP
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <UserProfileBlock
          displayName={displayName ?? null}
          username={username ?? null}
          variant="admin"
          role={role}
          editProfileLink={profileHref}
          editLinkClassName="text-xs text-[#99f7ff] hover:text-cyan-200 hover:underline"
          showDivider
          compact
        />
      </div>
    </header>
  )
}
