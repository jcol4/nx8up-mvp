/**
 * ConditionalHeader — public-facing header on non-dashboard routes when signed in.
 * Returns null on /creator, /admin, /sponsor (those dashboards have their own headers),
 * on /onboarding and auth routes (full-screen flows), and until onboarding is complete
 * (avoids a flash of the profile strip and a misleading default during sign-in redirects).
 * No sign-in / sign-up buttons here; unauthenticated users see no header strip.
 */
'use client'

import { usePathname } from '@/i18n/navigation'
import { SignedIn } from '@clerk/nextjs'
import UserProfileBlock from '@/components/shared/UserProfileBlock'
import LocaleSwitcher from '@/components/shared/LocaleSwitcher'

type Props = {
  signedIn: boolean
  onboardingComplete?: boolean
  displayName?: string | null
  username?: string | null
  role?: string
}

export default function ConditionalHeader({
  signedIn,
  onboardingComplete,
  displayName,
  username,
  role,
}: Props) {
  const pathname = usePathname()

  if (
    signedIn &&
    onboardingComplete !== true &&
    role !== 'admin'
  ) {
    return null
  }

  if (
    pathname?.startsWith('/creator') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/sponsor') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up') ||
    pathname?.startsWith('/forgot-password')
  ) {
    return null
  }

  const variant =
    role === 'creator'
      ? 'creator'
      : role === 'sponsor'
        ? 'sponsor'
        : role === 'admin'
          ? 'admin'
          : 'creator'
  const editProfileLink =
    role === 'creator' || role === 'admin'
      ? '/creator/profile'
      : role === 'sponsor'
        ? '/sponsor/profile'
        : undefined

  return (
    <SignedIn>
      <header className="flex h-16 items-center justify-end gap-4 p-4">
        <LocaleSwitcher />
        <UserProfileBlock
          displayName={displayName ?? null}
          username={username ?? null}
          variant={variant}
          editProfileLink={editProfileLink}
          role={role}
        />
      </header>
    </SignedIn>
  )
}
