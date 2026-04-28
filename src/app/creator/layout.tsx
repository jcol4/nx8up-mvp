/**
 * Creator section layout (`/creator/**`).
 *
 * - Role guard: `/sign-in` if unauthenticated; `/` if role is not creator or admin.
 * - HUD background (`NxHudBackground`) and `creator-hud` theme (see `globals.css`).
 * - Body/headline font variables via `next/font` (Inter, Space Grotesk).
 *
 * Section chrome (sidebar, header) lives in per-page shells such as
 * `CreatorRouteShell` / `CreatorCommandCenter`, not in this layout.
 */
import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Inter, Space_Grotesk } from 'next/font/google'
import NxHudBackground from '@/components/nx-shell/NxHudBackground'

export const metadata: Metadata = {
  title: 'Creator Dashboard | nx8up',
  description: 'Creator dashboard',
}

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-headline',
  subsets: ['latin'],
})

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) redirect('/sign-in')
  if (role !== 'creator' && role !== 'admin') redirect('/')

  return (
    <div className={`creator-hud relative isolate ${inter.variable} ${spaceGrotesk.variable}`}>
      <NxHudBackground />
      <main className="flex min-h-screen flex-col">{children}</main>
    </div>
  )
}
