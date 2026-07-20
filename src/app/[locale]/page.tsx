/**
 * @file page.tsx
 * @description Root route for nx8up (/[locale]).
 *
 * Responsibilities:
 * - Signed-out visitors (no Clerk session on this browser) see the public marketing
 *   landing page — aimed at new users, routing them into sign-up / sign-in.
 * - Authenticated users are redirected straight to their role-specific dashboard
 *   (admin → /admin, creator → /creator, sponsor → /sponsor), or to /onboarding if
 *   they have no role yet.
 *
 * External services: Clerk (auth).
 *
 * Note: reaching this route while signed-out depends on src/proxy.ts allowing the
 * locale root through for unauthenticated users (rather than bouncing to /sign-in).
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Landing from './Landing'

export default async function HomePage() {
  const { userId, sessionClaims } = await auth()

  // Signed-out → public landing page.
  if (!userId) {
    return <Landing />
  }

  // Signed-in → role-based dashboard.
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role === 'admin') redirect('/admin')
  if (role === 'creator') redirect('/creator')
  if (role === 'sponsor') redirect('/sponsor')
  redirect('/onboarding')
}
