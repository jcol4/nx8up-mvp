'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const VALID_ROLES = ['creator', 'sponsor', 'admin']

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