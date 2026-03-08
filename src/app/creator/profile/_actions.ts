'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { CreatorProfile } from '@/lib/creator-profile'
import { prisma } from '@/lib/prisma'
import { parseLocation } from '@/lib/location-options'

export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  const { userId } = await auth()
  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const meta = user.publicMetadata as Record<string, unknown> | null
  const email = user.emailAddresses[0]?.emailAddress ?? ''

  const fromDb = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
  })

  const { city, state, country } = parseLocation(fromDb?.location ?? undefined)

  const categories = fromDb?.content_type?.length
    ? fromDb.content_type
    : Array.isArray(meta?.categories)
      ? (meta.categories as string[])
      : undefined

  return {
    displayName: (meta?.displayName as string) ?? undefined,
    bio: (meta?.bio as string) ?? undefined,
    categories,
    urls: Array.isArray(meta?.urls)
      ? (meta.urls as { label?: string; url: string }[])
      : undefined,
    location: fromDb?.location ?? undefined,
    city,
    state,
    country,
    platform: fromDb?.platform?.length ? fromDb.platform : undefined,
    game_category: fromDb?.game_category?.length ? fromDb.game_category : undefined,
    language: fromDb?.language?.length ? fromDb.language : undefined,
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

function formatLocationString(city: string, state: string, country: string): string {
  const parts = [city.trim(), state.trim(), country.trim()].filter(Boolean)
  return parts.join(', ')
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
    const email = user.emailAddresses[0]?.emailAddress ?? ''
    const existing = (user.publicMetadata || {}) as Record<string, unknown>

    const normalizedUrls = urlsToSave.map((u) => ({
      label: u.label?.trim() || undefined,
      url: /^https?:\/\//i.test(u.url.trim()) ? u.url.trim() : `https://${u.url.trim()}`,
    }))

    const locationStr = formatLocationString(
      data.city ?? '',
      data.state ?? '',
      data.country ?? ''
    )
    const platform = data.platform?.length ? data.platform : []
    const game_category = data.game_category?.length ? data.game_category : []
    const language = data.language?.length ? data.language : []

    const content_type = data.categories?.length ? data.categories : []

    await prisma.content_creators.upsert({
      where: { clerk_user_id: userId },
      create: {
        clerk_user_id: userId,
        email,
        location: locationStr || undefined,
        platform,
        game_category,
        language,
        content_type,
      },
      update: {
        location: locationStr || undefined,
        platform,
        game_category,
        language,
        content_type,
        updated_at: new Date(),
      },
    })

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

    await prisma.content_creators.updateMany({
      where: { clerk_user_id: userId },
      data: {
        location: null,
        platform: [],
        game_category: [],
        language: [],
        content_type: [],
        updated_at: new Date(),
      },
    })

    revalidatePath('/creator')
    revalidatePath('/creator/profile')
    revalidatePath('/admin')
    return {}
  } catch {
    return { error: 'Failed to delete profile' }
  }
}
