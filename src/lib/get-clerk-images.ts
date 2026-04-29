import { clerkClient } from '@clerk/nextjs/server'

/**
 * Batch-fetches Clerk imageUrls for a list of user IDs.
 * Returns a map of clerkUserId → imageUrl.
 * Missing or errored users are omitted from the map.
 */
export async function getClerkImageUrls(clerkUserIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(clerkUserIds.filter(Boolean))]
  if (!unique.length) return {}
  try {
    const client = await clerkClient()
    const { data: users } = await client.users.getUserList({ userId: unique, limit: unique.length })
    return Object.fromEntries(users.map((u) => [u.id, u.imageUrl]))
  } catch {
    return {}
  }
}
