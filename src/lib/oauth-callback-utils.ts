import { cookies } from 'next/headers'
import { prisma } from './prisma'

/**
 * Reads a CSRF cookie, clears it, and returns whether it matches the expected value.
 * Used by OAuth and OpenID callback routes to prevent CSRF attacks.
 */
export async function validateCsrfCookie(cookieName: string, expectedValue: string | null): Promise<boolean> {
  const cookieStore = await cookies()
  const saved = cookieStore.get(cookieName)?.value
  cookieStore.delete(cookieName)
  return !!saved && !!expectedValue && saved === expectedValue
}

/**
 * Looks up the creator row for a Clerk user and fires an aggregate CTR recompute
 * in the background (non-blocking). Safe to call after any OAuth connection.
 */
export async function triggerCtrRecomputeForUser(userId: string): Promise<void> {
  const { recomputeCreatorAggregateCtr } = await import('./ctr')
  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (creator) {
    recomputeCreatorAggregateCtr(creator.id).catch(console.error)
  }
}
