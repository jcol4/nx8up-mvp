'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export async function updateUserLocale(locale: string) {
  const { userId } = await auth()
  if (!userId) return

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { locale },
  })
}
