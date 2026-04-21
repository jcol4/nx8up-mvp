/**
 * Server actions for admin user management.
 *
 * Currently exposes a single action: `setUserRole`, which allows an admin to
 * update another user's role in Clerk's `publicMetadata`.
 *
 * All actions re-validate the caller's admin role on every invocation —
 * they do not rely solely on layout-level guards.
 *
 * External services: Clerk (`clerkClient`, `auth`).
 */
'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const VALID_ROLES = ['creator', 'sponsor', 'admin']

/**
 * Sets a Clerk user's role in their `publicMetadata`.
 *
 * @param targetUserId - The Clerk user ID of the user to update.
 * @param role - The new role to assign. Must be one of `VALID_ROLES`
 *   (`"creator"`, `"sponsor"`, `"admin"`).
 * @returns `{ success: true }` on success, or `{ error: string }` if the
 *   caller is not an admin, the role is invalid, or the Clerk API call fails.
 *
 * Side effect: revalidates the `/admin/users` route cache so the table
 * reflects the new role immediately.
 */
export async function setUserRole(
  targetUserId: string,
  role: string
): Promise<{ error?: string; success?: boolean }> {
  const { sessionClaims } = await auth()
  const callerRole = (sessionClaims?.metadata as { role?: string })?.role

  if (callerRole !== 'admin') {
    return { error: 'Unauthorized' }
  }

  if (!VALID_ROLES.includes(role)) {
    return { error: 'Invalid role' }
  }

  if (!targetUserId) {
    return { error: 'Missing user ID' }
  }

  try {
    const client = await clerkClient()
    await client.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role },
    })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err) {
    console.error('setUserRole error:', err)
    return { error: 'Failed to update role. Please try again.' }
  }
}