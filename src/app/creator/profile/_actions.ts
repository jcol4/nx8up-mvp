'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { CreatorProfile } from '@/lib/creator-profile'

export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  const { userId } = await auth()
  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.publicMetadata as Record<string, unknown> | null

  return {
    displayName: (meta?.displayName as string) ?? undefined,
    bio: (meta?.bio as string) ?? undefined,
    categories: Array.isArray(meta?.categories) ? (meta.categories as string[]) : undefined,
    urls: Array.isArray(meta?.urls)
      ? (meta.urls as { label?: string; url: string }[])
      : undefined,
  }
}

function isValidUrl(s: string): boolean {
  const trimmed = s?.trim()
  if (!trimmed) return false
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const u = new URL(withProtocol)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return host === 'localhost' || host.includes('.')
  } catch {
    return false
  }
}

export async function updateCreatorProfile(data: CreatorProfile): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const urlsToSave = data.urls?.filter((u) => u.url?.trim()) ?? []
    const invalid = urlsToSave.find((u) => !isValidUrl(u.url))
  if (invalid) {
    return { error: `"${invalid.url}" is not a valid URL. Use a proper link like https://twitch.tv/you or https://youtube.com/@you` }
  }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>

    const normalizedUrls = urlsToSave.map((u) => ({
      label: u.label?.trim() || undefined,
      url: /^https?:\/\//i.test(u.url.trim()) ? u.url.trim() : `https://${u.url.trim()}`,
    }))

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existing,
        displayName: data.displayName?.trim() || undefined,
        bio: data.bio?.trim() || undefined,
        categories: data.categories?.length ? data.categories : undefined,
        urls: normalizedUrls.length ? normalizedUrls : undefined,
      },
    })

    revalidatePath('/creator')
    revalidatePath('/creator/profile')
    revalidatePath('/admin')
    return {}
  } catch {
    return { error: 'Failed to update profile' }
  }
}

export async function deleteCreatorProfile(): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existing = (user.publicMetadata || {}) as Record<string, unknown>

    const { displayName, bio, categories, urls, creatorFollowers, creatorSubscribers, creatorNextPayout, steamLinked, twitchUrl, youtubeUrl, ...keep } = existing
    await client.users.updateUser(userId, {
      publicMetadata: keep,
    })

    revalidatePath('/creator')
    revalidatePath('/creator/profile')
    revalidatePath('/admin')
    return {}
  } catch {
    return { error: 'Failed to delete profile' }
  }
}
