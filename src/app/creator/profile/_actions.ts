'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { CreatorProfile } from '@/lib/creator-profile'
import { prisma } from '@/lib/prisma'
import { parseLocation } from '@/lib/location-options'
import { 
  getTwitchUserByLogin, 
  getTwitchUserById, 
  getTwitchFollowerCount,
  getTwitchStreamStats,
  isTwitchDataStale 
} from '@/lib/twitch'
import { 
  getYouTubeChannelByHandle, 
  getYouTubeChannelById, 
  getYouTubeChannelStats, 
  isYouTubeDataStale 
} from '@/lib/youtube'

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
    // Twitch-derived — used to pre-populate form suggestions
    average_viewers: fromDb?.average_viewers ?? undefined,
    subs_followers: fromDb?.subs_followers ?? undefined,
  }
}

export async function updateCreatorProfile(data: CreatorProfile): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const urlsToSave = data.urls?.filter((u) => u.url?.trim()) ?? []
  const invalid = urlsToSave.find((u) => !isValidUrl(u.url))
  if (invalid) {
    return {
      error: `"${invalid.url}" is not a valid URL. Use a proper link like https://twitch.tv/you or https://youtube.com/@you`,
    }
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
    // most_played_games: save whatever the creator has in the form
    // (could be Twitch-derived, manually edited, or a mix)
    const most_played_games = data.most_played_games?.length ? data.most_played_games : []

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
        average_viewers: data.average_viewers ?? null,
        subs_followers: data.subs_followers ?? null,  
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

export async function linkTwitchAccount(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const username = (formData.get('twitch_username') as string)?.trim()
  if (!username) return { error: 'Please enter a Twitch username' }

  try {
    const twitchUser = await getTwitchUserByLogin(username)
    if (!twitchUser) {
      return { error: `Twitch account "${username}" not found. Check the username and try again.` }
    }

    const existingLink = await prisma.content_creators.findFirst({
      where: {
        twitch_id: twitchUser.id,
        NOT: { clerk_user_id: userId },
      },
    })

    if (existingLink) {
      return { error: 'This Twitch account is already linked to another NX8UP profile.' }
    }

    // Fetch stats immediately on link — don't wait for stale check
    const [followerCount, streamStats] = await Promise.all([
      getTwitchFollowerCount(twitchUser.id),
      getTwitchStreamStats(twitchUser.id, twitchUser.broadcaster_type === 'partner' ? 60 : 14),
    ])

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        twitch_username: twitchUser.login,
        twitch_id: twitchUser.id,
        twitch_broadcaster_type: twitchUser.broadcaster_type,
        twitch_description: twitchUser.description,
        twitch_profile_image: twitchUser.profile_image_url,
        twitch_created_at: new Date(twitchUser.created_at),
        twitch_synced_at: new Date(),
        // Stats
        subs_followers: followerCount,
        average_viewers: streamStats.average_viewers,
      },
    })

    return {
      success: true,
      twitch: {
        username: twitchUser.login,
        display_name: twitchUser.display_name,
        broadcaster_type: twitchUser.broadcaster_type,
        profile_image: twitchUser.profile_image_url,
        description: twitchUser.description,
      },
    }
  } catch (err: any) {
    console.error('linkTwitchAccount error:', err)
    return { error: 'Failed to link Twitch account. Please try again.' }
  }
}

// Unlink Twitch account
export async function unlinkTwitchAccount() {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        twitch_username: null,
        twitch_id: null,
        twitch_broadcaster_type: null,
        twitch_description: null,
        twitch_profile_image: null,
        twitch_created_at: null,
        twitch_synced_at: null,
      },
    })

    return { success: true }
  } catch (err: any) {
    console.error('unlinkTwitchAccount error:', err)
    return { error: 'Failed to unlink Twitch account.' }
  }
}

export async function refreshTwitchDataIfStale(userId: string) {
  try {
    const creator = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: {
        twitch_id: true,
        twitch_synced_at: true,
        twitch_broadcaster_type: true,  // add this
      },
    })

    if (!creator?.twitch_id) return
    if (!isTwitchDataStale(creator.twitch_synced_at)) return

    const lookbackDays = creator.twitch_broadcaster_type === 'partner' ? 60 : 14

    const [twitchUser, followerCount, streamStats] = await Promise.all([
      getTwitchUserById(creator.twitch_id),
      getTwitchFollowerCount(creator.twitch_id),
      getTwitchStreamStats(creator.twitch_id, lookbackDays),
    ])

    if (!twitchUser) return

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        twitch_username: twitchUser.login,
        twitch_broadcaster_type: twitchUser.broadcaster_type,
        twitch_description: twitchUser.description,
        twitch_profile_image: twitchUser.profile_image_url,
        twitch_synced_at: new Date(),
        subs_followers: followerCount,
        average_viewers: streamStats.average_viewers,
      },
    })
  } catch (err) {
    console.error('refreshTwitchDataIfStale error:', err)
  }
}

// ADD these functions to src/app/creator/profile/_actions.ts
// Also add this import at the top of _actions.ts:
// import { getYouTubeChannelByHandle, getYouTubeChannelById, getYouTubeChannelStats, isYouTubeDataStale } from '@/lib/youtube'

export async function linkYouTubeAccount(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const handle = (formData.get('youtube_handle') as string)?.trim()
  if (!handle) return { error: 'Please enter a YouTube channel handle' }

  try {
    const channel = await getYouTubeChannelByHandle(handle)

    if (!channel) {
      return {
        error: `YouTube channel "${handle}" not found. Try your @handle or channel name.`,
      }
    }

    // Check if already linked to another account
    const existingLink = await prisma.content_creators.findFirst({
      where: {
        youtube_channel_id: channel.id,
        NOT: { clerk_user_id: userId },
      },
    })

    if (existingLink) {
      return { error: 'This YouTube channel is already linked to another NX8UP profile.' }
    }

    // Fetch stats immediately on link
    const stats = await getYouTubeChannelStats(channel.id)

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        youtube_handle: channel.handle,
        youtube_channel_id: channel.id,
        youtube_channel_name: channel.title,
        youtube_subscribers: channel.subscriber_count,
        youtube_avg_views: stats.avg_views,
        youtube_top_categories: stats.top_categories,
        youtube_synced_at: new Date(),
      },
    })

    return {
      success: true,
      youtube: {
        handle: channel.handle,
        channel_name: channel.title,
        subscribers: channel.subscriber_count,
        avg_views: stats.avg_views,
        top_categories: stats.top_categories,
      },
    }
  } catch (err: any) {
    console.error('linkYouTubeAccount error:', err)
    return { error: 'Failed to link YouTube account. Please try again.' }
  }
}

export async function unlinkYouTubeAccount() {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        youtube_handle: null,
        youtube_channel_id: null,
        youtube_channel_name: null,
        youtube_subscribers: null,
        youtube_avg_views: null,
        youtube_top_categories: [],
        youtube_synced_at: null,
      },
    })

    return { success: true }
  } catch (err: any) {
    console.error('unlinkYouTubeAccount error:', err)
    return { error: 'Failed to unlink YouTube account.' }
  }
}

export async function refreshYouTubeDataIfStale(userId: string) {
  try {
    const creator = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: {
        youtube_channel_id: true,
        youtube_synced_at: true,
      },
    })

    if (!creator?.youtube_channel_id) return
    if (!isYouTubeDataStale(creator.youtube_synced_at)) return

    const [channel, stats] = await Promise.all([
      getYouTubeChannelById(creator.youtube_channel_id),
      getYouTubeChannelStats(creator.youtube_channel_id),
    ])

    if (!channel) return

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        youtube_channel_name: channel.title,
        youtube_handle: channel.handle,
        youtube_subscribers: channel.subscriber_count,
        youtube_avg_views: stats.avg_views,
        youtube_top_categories: stats.top_categories,
        youtube_synced_at: new Date(),
      },
    })
  } catch (err) {
    console.error('refreshYouTubeDataIfStale error:', err)
    // Silent fail — stale data is better than a broken page
  }
}