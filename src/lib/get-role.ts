'use server'
/**
 * Server-side Clerk role helper.
 * Reads the 'role' field from the authenticated user's Clerk public metadata.
 * Returns null if the user is not signed in or has no role set.
 */
import { auth, clerkClient } from '@clerk/nextjs/server'

/** Returns the current user's role ('creator' | 'sponsor' | 'admin'), or null if unauthenticated. */
export async function getUserRole() {
  const { userId } = await auth()
  if (!userId) return null
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  return (user.publicMetadata?.role as string) ?? null
}