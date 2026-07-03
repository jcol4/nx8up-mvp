/**
 * @file onboarding/layout.tsx
 *
 * Server-side layout guard for the /onboarding route tree.
 *
 * Behavior:
 * - Reads the current Clerk session on every request (server component).
 * - If `sessionClaims.metadata.onboardingComplete` is already `true`, the
 *   user has previously finished onboarding and is redirected to the root `/`
 *   so they cannot reach the onboarding page again.
 * - Otherwise the children (the onboarding page) are rendered unchanged.
 *
 * External services: Clerk (auth token / session claims)
 *
 * Gotcha: The redirect fires before any child component renders, so there is
 * no flash of the onboarding UI for already-onboarded users.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function RootLayout({ children }: {children: React.ReactNode }) {
    if ((await auth()).sessionClaims?.metadata?.onboardingComplete === true) {
        redirect('/')
    }

    return <>{children}</>
}