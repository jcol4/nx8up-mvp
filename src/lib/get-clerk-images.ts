import { unstable_cache } from 'next/cache'
import { clerkClient } from '@clerk/nextjs/server'

/** Revalidate tag for the cached Clerk image lookups. */
export const CLERK_IMAGES_CACHE_TAG = 'clerk-images'

/**
 * Returns a Clerk-hosted avatar URL resized to `size`×`size` px. Clerk's image
 * CDN (img.clerk.com) resizes and caches via query params, so this shrinks the
 * bytes fetched for small avatars without routing through Next's optimizer
 * (avatars keep `unoptimized`). Pass 2× the rendered size for retina. Non-Clerk
 * or unparseable URLs are returned unchanged.
 */
export function clerkAvatarUrl(url: string, size: number): string {
  try {
    const u = new URL(url)
    if (!u.hostname.endsWith('clerk.com')) return url
    u.searchParams.set('width', String(size))
    u.searchParams.set('height', String(size))
    u.searchParams.set('fit', 'crop')
    u.searchParams.set('quality', '85')
    return u.toString()
  } catch {
    return url
  }
}

/**
 * Batch-fetches Clerk imageUrls for a list of user IDs.
 * Returns a map of clerkUserId → imageUrl.
 * Missing or errored users are omitted from the map.
 *
 * The successful lookup is cached across requests (keyed by the sorted unique
 * id set) so repeated navigation/pagination doesn't re-hit Clerk's API on the
 * render hot path. Avatars change rarely, so a short TTL is plenty; errors are
 * caught outside the cache so a transient Clerk failure is never cached.
 */
export async function getClerkImageUrls(clerkUserIds: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(clerkUserIds.filter(Boolean))].sort()
  if (!unique.length) return {}
  try {
    return await unstable_cache(
      async () => {
        const client = await clerkClient()
        const { data: users } = await client.users.getUserList({ userId: unique, limit: unique.length })
        return Object.fromEntries(users.map((u) => [u.id, u.imageUrl]))
      },
      ['clerk-image-urls', ...unique],
      { revalidate: 300, tags: [CLERK_IMAGES_CACHE_TAG] },
    )()
  } catch {
    return {}
  }
}
