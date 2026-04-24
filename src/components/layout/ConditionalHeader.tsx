/**
 * ConditionalHeader — public-facing header rendered on non-dashboard routes.
 * Returns null on /creator, /admin, and /sponsor routes (those dashboards have their own headers).
 */
'use client'

import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import UserProfileBlock from '@/components/shared/UserProfileBlock'

type Props = {
  displayName?: string | null
  username?: string | null
  role?: string
}

export default function ConditionalHeader({ displayName, username, role }: Props) {
  const pathname = usePathname()
  if (pathname?.startsWith('/creator') || pathname?.startsWith('/admin') || pathname?.startsWith('/sponsor')) return null

  const variant = role === 'creator' ? 'creator' : role === 'sponsor' ? 'sponsor' : 'admin'
  const editProfileLink =
    role === 'creator' || role === 'admin'
      ? '/creator/profile'
      : role === 'sponsor'
        ? '/sponsor/profile'
        : undefined

  return (
    <header className="flex justify-end items-center p-4 gap-4 h-16">
      <SignedOut>
        <SignInButton />
        <SignUpButton>
          <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
            Sign Up
          </button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserProfileBlock
          displayName={displayName ?? null}
          username={username ?? null}
          variant={variant}
          editProfileLink={editProfileLink}
          role={role}
        />
      </SignedIn>
    </header>
  )
}
