// /**
//  * Creator profile server actions.
//  *
//  * Provides the following operations:
//  *
//  * - **getCreatorProfile** — reads the creator's profile from a hybrid source:
//  *   structured fields (platform, location, game_category, etc.) come from the
//  *   `content_creators` DB row; displayName, bio, categories, and urls come
//  *   from Clerk `publicMetadata`.
//  *
//  * - **updateCreatorProfile** — legacy flat-form save; validates URLs, upserts
//  *   the DB row, and updates Clerk `publicMetadata`.
//  *
//  * - **updateCreatorProfileWizard** — wizard-based save; upserts the DB row
//  *   with all 7-step fields and recomputes `creator_size` based on follower
//  *   counts.
//  *
//  * - **deleteCreatorProfile** — clears structured fields from both DB and
//  *   Clerk metadata (display name, bio, categories, etc.).
//  *
//  * - **unlinkTwitchAccount** / **unlinkYouTubeAccount** — nulls out the
//  *   respective OAuth fields on the DB row.
//  *
//  * - **refreshTwitchDataIfStale** — re-fetches Twitch stats (followers, VOD
//  *   views) from the Twitch API when the last sync is older than the staleness
//  *   window. Recomputes `creator_size` and CTR aggregate afterward.
//  *
//  * - **refreshYouTubeDataIfStale** — re-fetches YouTube channel stats; also
//  *   attempts to refresh watch-time and member-count data using the stored
//  *   OAuth access token (refreshing it via the Google token endpoint if expired).
//  *
//  * Commented-out functions (`linkTwitchAccount`, `linkYouTubeAccount`) are
//  * the manual-link flows that predate OAuth; they are preserved as reference.
//  *
//  * External services: Clerk (auth + publicMetadata), Prisma/PostgreSQL,
//  * Twitch Helix API, YouTube Data API v3, YouTube Analytics API,
//  * Google OAuth2 token endpoint.
//  *
//  * Env vars:
//  *  - `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
//  *  - `YOUTUBE_API_KEY`
//  *  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
//  *
//  * Gotcha: `refreshYouTubeDataIfStale` performs an extra DB query inside the
//  * `creator_size` computation within the main update call (lines ~666-669),
//  * resulting in two sequential DB hits. This could be collapsed into one.
//  */
// 'use server'

// import { auth, clerkClient } from '@clerk/nextjs/server'
// import { revalidatePath } from 'next/cache'
// import type { CreatorProfile } from '@/lib/creator-profile'
// import { prisma } from '@/lib/prisma'
// import { parseLocation } from '@/lib/location-options'
// import { computeCreatorSize } from '@/lib/matching'
// import { 
//   getTwitchUserByLogin, 
//   getTwitchUserById, 
//   getTwitchFollowerCount,
//   getTwitchStreamStats,
//   isTwitchDataStale 
// } from '@/lib/twitch'
// import {
//   getYouTubeChannelByHandle,
//   getYouTubeChannelById,
//   getYouTubeChannelStats,
//   isYouTubeDataStale
// } from '@/lib/youtube'
// import { decryptToken, encryptToken } from '@/lib/token-encryption'

// /**
//  * Validates a URL string, prepending `https://` if no protocol is present.
//  * Accepts `localhost` and any hostname containing a dot.
//  * Returns `false` for empty, null-ish, or malformed inputs.
//  */
// function isValidUrl(s: string): boolean {
//   const trimmed = s?.trim()
//   if (!trimmed) return false
//   try {
//     const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
//     const u = new URL(withProtocol)
//     if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
//     const host = u.hostname.toLowerCase()
//     return host === 'localhost' || host.includes('.')
//   } catch {
//     return false
//   }
// }

// /**
//  * Joins non-empty city, state, and country values with ", " to produce a
//  * human-readable location string stored in the `location` DB column.
//  */
// function formatLocationString(city: string, state: string, country: string): string {
//   const parts = [city.trim(), state.trim(), country.trim()].filter(Boolean)
//   return parts.join(', ')
// }

// /**
//  * Fetches the current creator profile for the authenticated user.
//  * Data is merged from two sources:
//  *  - Clerk `publicMetadata`: displayName, bio, categories, urls.
//  *  - `content_creators` DB row: all structured fields (location, platform,
//  *    language, audience demographics, etc.).
//  *
//  * Returns `null` for unauthenticated users.
//  */
// export async function getCreatorProfile(): Promise<CreatorProfile | null> {
//   const { userId } = await auth()
//   if (!userId) return null

//   const client = await clerkClient()
//   const user = await client.users.getUser(userId)
//   const meta = user.publicMetadata as Record<string, unknown> | null
//   const email = user.emailAddresses[0]?.emailAddress ?? ''

//   const fromDb = await prisma.content_creators.findUnique({
//     where: { clerk_user_id: userId },
//   })

//   const { city, state, country } = parseLocation(fromDb?.location ?? undefined)

//   const categories = fromDb?.content_type?.length
//     ? fromDb.content_type
//     : Array.isArray(meta?.categories)
//       ? (meta.categories as string[])
//       : undefined

//   return {
//     displayName: (meta?.displayName as string) ?? undefined,
//     bio: (meta?.bio as string) ?? undefined,
//     categories,
//     urls: Array.isArray(meta?.urls)
//       ? (meta.urls as { label?: string; url: string }[])
//       : undefined,
//     location: fromDb?.location ?? undefined,
//     city,
//     state,
//     country,
//     platform: fromDb?.platform?.length ? fromDb.platform : undefined,
//     game_category: fromDb?.game_category?.length ? fromDb.game_category : undefined,
//     language: fromDb?.language?.length ? fromDb.language : undefined,
//     // Audience demographics
//     audience_age_min: fromDb?.audience_age_min ?? undefined,
//     audience_age_max: fromDb?.audience_age_max ?? undefined,
//     audience_locations: fromDb?.audience_locations?.length ? fromDb.audience_locations : undefined,
//     audience_gender: fromDb?.audience_gender?.length ? fromDb.audience_gender : undefined,
//     // Creator identity
//     creator_types: fromDb?.creator_types?.length ? fromDb.creator_types : undefined,
//     primary_platform: fromDb?.primary_platform ?? undefined,
//     // Content & audience tags
//     content_style: fromDb?.content_style?.length ? fromDb.content_style : undefined,
//     audience_interests: fromDb?.audience_interests?.length ? fromDb.audience_interests : undefined,
//     // Brand & campaign preferences
//     preferred_campaign_types: fromDb?.preferred_campaign_types?.length ? fromDb.preferred_campaign_types : undefined,
//     preferred_product_types: fromDb?.preferred_product_types?.length ? fromDb.preferred_product_types : undefined,
//     // Eligibility
//     is_available: fromDb?.is_available ?? undefined,
//     max_campaigns_per_month: fromDb?.max_campaigns_per_month ?? undefined,
//   }
// }

// /**
//  * Saves the legacy flat-form profile. Validates all provided URLs, upserts
//  * the `content_creators` DB row, and writes displayName/bio/categories/urls
//  * to Clerk `publicMetadata`. Revalidates `/creator`, `/creator/profile`, and
//  * `/admin` on success.
//  */
// export async function updateCreatorProfile(data: CreatorProfile): Promise<{ error?: string }> {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   const urlsToSave = data.urls?.filter((u) => u.url?.trim()) ?? []
//   const invalid = urlsToSave.find((u) => !isValidUrl(u.url))
//   if (invalid) {
//     return {
//       error: `"${invalid.url}" is not a valid URL. Use a proper link like https://twitch.tv/you or https://youtube.com/@you`,
//     }
//   }

//   try {
//     const client = await clerkClient()
//     const user = await client.users.getUser(userId)
//     const email = user.emailAddresses[0]?.emailAddress ?? ''
//     const existing = (user.publicMetadata || {}) as Record<string, unknown>

//     const normalizedUrls = urlsToSave.map((u) => ({
//       label: u.label?.trim() || undefined,
//       url: /^https?:\/\//i.test(u.url.trim()) ? u.url.trim() : `https://${u.url.trim()}`,
//     }))

//     const locationStr = formatLocationString(
//       data.city ?? '',
//       data.state ?? '',
//       data.country ?? ''
//     )

//     const platform = data.platform?.length ? data.platform : []
//     const game_category = data.game_category?.length ? data.game_category : []
//     const language = data.language?.length ? data.language : []
//     const content_type = data.categories?.length ? data.categories : []
//     const most_played_games = data.most_played_games?.length ? data.most_played_games : []
//     const audience_locations = data.audience_locations?.length ? data.audience_locations : []

//     await prisma.content_creators.upsert({
//       where: { clerk_user_id: userId },
//       create: {
//         clerk_user_id: userId,
//         email,
//         location: locationStr || undefined,
//         platform,
//         game_category,
//         language,
//         content_type,
//         audience_age_min: data.audience_age_min ?? undefined,
//         audience_age_max: data.audience_age_max ?? undefined,
//         audience_locations,
//       },
//       update: {
//         location: locationStr || undefined,
//         platform,
//         game_category,
//         language,
//         content_type,
//         updated_at: new Date(),
//         audience_age_min: data.audience_age_min ?? null,
//         audience_age_max: data.audience_age_max ?? null,
//         audience_locations,
//       },
//     })

//     await client.users.updateUser(userId, {
//       publicMetadata: {
//         ...existing,
//         displayName: data.displayName?.trim() || undefined,
//         bio: data.bio?.trim() || undefined,
//         categories: data.categories?.length ? data.categories : undefined,
//         urls: normalizedUrls.length ? normalizedUrls : undefined,
//       },
//     })

//     revalidatePath('/creator')
//     revalidatePath('/creator/profile')
//     revalidatePath('/admin')
//     return {}
//   } catch {
//     return { error: 'Failed to update profile' }
//   }
// }

// /**
//  * Wizard save action — upserts the full `CreatorProfileDraft` into the DB
//  * and writes displayName/bio to Clerk `publicMetadata`. Also recomputes
//  * `creator_size` from the latest follower counts stored in the DB.
//  * Called on every "Save & Continue" step in the wizard.
//  */
// export async function updateCreatorProfileWizard(data: import('./_shared').CreatorProfileDraft): Promise<{ error?: string }> {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   try {
//     const client = await clerkClient()
//     const user = await client.users.getUser(userId)
//     const email = user.emailAddresses[0]?.emailAddress ?? ''
//     const existing = (user.publicMetadata || {}) as Record<string, unknown>

//     const locationStr = [data.city.trim(), data.state.trim(), data.country.trim()].filter(Boolean).join(', ')

//     // Fetch current follower counts to compute creator_size
//     const existing_cc = await prisma.content_creators.findUnique({
//       where: { clerk_user_id: userId },
//       select: { subs_followers: true, youtube_subscribers: true },
//     })
//     const creator_size = computeCreatorSize(
//       existing_cc?.subs_followers ?? null,
//       existing_cc?.youtube_subscribers ?? null,
//     )

//     await prisma.content_creators.upsert({
//       where: { clerk_user_id: userId },
//       create: {
//         clerk_user_id: userId,
//         email,
//         location: locationStr || undefined,
//         language: data.language,
//         platform: data.platform,
//         game_category: data.game_category,
//         content_type: data.content_type,
//         audience_age_min: data.audience_age_min ? parseInt(data.audience_age_min, 10) : undefined,
//         audience_age_max: data.audience_age_max ? parseInt(data.audience_age_max, 10) : undefined,
//         audience_locations: data.audience_locations,
//         audience_gender: data.audience_gender,
//         creator_types: data.creator_types,
//         primary_platform: data.primary_platform || null,
//         content_style: data.content_style,
//         audience_interests: data.audience_interests,
//         preferred_campaign_types: data.preferred_campaign_types,
//         preferred_product_types: data.preferred_product_types,
//         is_available: data.is_available,
//         max_campaigns_per_month: data.max_campaigns_per_month ? parseInt(data.max_campaigns_per_month, 10) : undefined,
//         ...(creator_size ? { creator_size } : {}),
//       },
//       update: {
//         location: locationStr || null,
//         language: data.language,
//         platform: data.platform,
//         game_category: data.game_category,
//         content_type: data.content_type,
//         audience_age_min: data.audience_age_min ? parseInt(data.audience_age_min, 10) : null,
//         audience_age_max: data.audience_age_max ? parseInt(data.audience_age_max, 10) : null,
//         audience_locations: data.audience_locations,
//         audience_gender: data.audience_gender,
//         creator_types: data.creator_types,
//         primary_platform: data.primary_platform || null,
//         content_style: data.content_style,
//         audience_interests: data.audience_interests,
//         preferred_campaign_types: data.preferred_campaign_types,
//         preferred_product_types: data.preferred_product_types,
//         is_available: data.is_available,
//         max_campaigns_per_month: data.max_campaigns_per_month ? parseInt(data.max_campaigns_per_month, 10) : null,
//         ...(creator_size ? { creator_size } : {}),
//         updated_at: new Date(),
//       },
//     })

//     await client.users.updateUser(userId, {
//       publicMetadata: {
//         ...existing,
//         displayName: data.displayName.trim() || undefined,
//         bio: data.bio.trim() || undefined,
//       },
//     })

//     revalidatePath('/creator')
//     revalidatePath('/creator/profile')
//     revalidatePath('/admin')
//     return {}
//   } catch {
//     return { error: 'Failed to save profile' }
//   }
// }

// /**
//  * Clears the creator's profile data from both Clerk `publicMetadata` and the
//  * `content_creators` DB row. OAuth connection fields (twitch_id, etc.) are
//  * NOT cleared — only the manually entered profile fields.
//  *
//  * Gotcha: uses `updateMany` (not `update`) in case no DB row exists yet for
//  * the user, which silently no-ops rather than throwing.
//  */
// export async function deleteCreatorProfile(): Promise<{ error?: string }> {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   try {
//     const client = await clerkClient()
//     const user = await client.users.getUser(userId)
//     const existing = (user.publicMetadata || {}) as Record<string, unknown>

//     const { displayName, bio, categories, urls, creatorFollowers, creatorSubscribers, creatorNextPayout, steamLinked, twitchUrl, youtubeUrl, ...keep } = existing
//     await client.users.updateUser(userId, {
//       publicMetadata: keep,
//     })

//     await prisma.content_creators.updateMany({
//       where: { clerk_user_id: userId },
//       data: {
//         location: null,
//         platform: [],
//         game_category: [],
//         language: [],
//         content_type: [],
//         audience_age_min: null,
//         audience_age_max: null,
//         audience_locations: [],
//         updated_at: new Date(),
//       },
//     })

//     revalidatePath('/creator')
//     revalidatePath('/creator/profile')
//     revalidatePath('/admin')
//     return {}
//   } catch {
//     return { error: 'Failed to delete profile' }
//   }
// }

// /*
// export async function linkTwitchAccount(formData: FormData) {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   const username = (formData.get('twitch_username') as string)?.trim()
//   if (!username) return { error: 'Please enter a Twitch username' }

//   try {
//     const twitchUser = await getTwitchUserByLogin(username)
//     if (!twitchUser) {
//       return { error: `Twitch account "${username}" not found. Check the username and try again.` }
//     }

//     const existingLink = await prisma.content_creators.findFirst({
//       where: {
//         twitch_id: twitchUser.id,
//         NOT: { clerk_user_id: userId },
//       },
//     })

//     if (existingLink) {
//       return { error: 'This Twitch account is already linked to another nx8up profile.' }
//     }

//     // Fetch stats immediately on link — don't wait for stale check
//     const [followerCount, streamStats] = await Promise.all([
//       getTwitchFollowerCount(twitchUser.id),
//       getTwitchStreamStats(twitchUser.id, twitchUser.broadcaster_type === 'partner' ? 60 : 14),
//     ])

//     await prisma.content_creators.update({
//       where: { clerk_user_id: userId },
//       data: {
//         twitch_username: twitchUser.login,
//         twitch_id: twitchUser.id,
//         twitch_broadcaster_type: twitchUser.broadcaster_type,
//         twitch_description: twitchUser.description,
//         twitch_profile_image: twitchUser.profile_image_url,
//         twitch_created_at: new Date(twitchUser.created_at),
//         twitch_synced_at: new Date(),
//         // Stats
//         subs_followers: followerCount,
//         average_vod_views: streamStats.average_vod_views,
//       },
//     })

//     return {
//       success: true,
//       twitch: {
//         username: twitchUser.login,
//         display_name: twitchUser.display_name,
//         broadcaster_type: twitchUser.broadcaster_type,
//         profile_image: twitchUser.profile_image_url,
//         description: twitchUser.description,
//       },
//     }
//   } catch (err: any) {
//     console.error('linkTwitchAccount error:', err)
//     return { error: 'Failed to link Twitch account. Please try again.' }
//   }
// }
// */

// /**
//  * Unlinks the creator's Twitch account by nulling all Twitch fields on the
//  * `content_creators` DB row. Does NOT remove Twitch stats from the DB —
//  * follower counts and VOD views are left as-is until overwritten on next link.
//  */
// export async function unlinkTwitchAccount() {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   try {
//     await prisma.content_creators.update({
//       where: { clerk_user_id: userId },
//       data: {
//         twitch_username: null,
//         twitch_id: null,
//         twitch_broadcaster_type: null,
//         twitch_description: null,
//         twitch_profile_image: null,
//         twitch_created_at: null,
//         twitch_synced_at: null,
//       },
//     })

//     return { success: true }
//   } catch (err: any) {
//     console.error('unlinkTwitchAccount error:', err)
//     return { error: 'Failed to unlink Twitch account.' }
//   }
// }

// /**
//  * Re-fetches Twitch stats for the creator identified by `userId` when the
//  * last sync timestamp is considered stale (determined by `isTwitchDataStale`).
//  *
//  * Lookback window for VOD stats: 60 days for partners, 14 days for others.
//  *
//  * On success: updates followers, broadcaster type, profile image, avg VOD
//  * views, `twitch_synced_at`, and recomputes `creator_size` and CTR aggregate.
//  *
//  * Swallows all errors — failures are logged but do not surface to the user.
//  * This function is called fire-and-forget from the profile page.
//  */
// export async function refreshTwitchDataIfStale(userId: string) {
//   try {
//     const creator = await prisma.content_creators.findUnique({
//       where: { clerk_user_id: userId },
//       select: {
//         twitch_id: true,
//         twitch_synced_at: true,
//         twitch_broadcaster_type: true,  // add this
//       },
//     })

//     if (!creator?.twitch_id) return
//     if (!isTwitchDataStale(creator.twitch_synced_at)) return

//     const lookbackDays = creator.twitch_broadcaster_type === 'partner' ? 60 : 14

//     const [twitchUser, followerCount, streamStats] = await Promise.all([
//       getTwitchUserById(creator.twitch_id),
//       getTwitchFollowerCount(creator.twitch_id),
//       getTwitchStreamStats(creator.twitch_id, lookbackDays),
//     ])

//     if (!twitchUser) return

//     const twitchCreator = await prisma.content_creators.findUnique({
//       where: { clerk_user_id: userId },
//       select: { youtube_subscribers: true },
//     })
//     await prisma.content_creators.update({
//       where: { clerk_user_id: userId },
//       data: {
//         twitch_username: twitchUser.login,
//         twitch_broadcaster_type: twitchUser.broadcaster_type,
//         twitch_description: twitchUser.description,
//         twitch_profile_image: twitchUser.profile_image_url,
//         twitch_synced_at: new Date(),
//         subs_followers: followerCount,
//         average_vod_views: streamStats.average_vod_views,
//         creator_size: computeCreatorSize(followerCount, twitchCreator?.youtube_subscribers ?? null) ?? undefined,
//       },
//     })

//     const { recomputeCreatorAggregateCtr } = await import('@/lib/ctr')
//     const updated = await prisma.content_creators.findUnique({
//       where: { clerk_user_id: userId },
//       select: { id: true },
//     })
//     if (updated) {
//       recomputeCreatorAggregateCtr(updated.id).catch(console.error)
//     }
//   } catch (err) {
//     console.error('refreshTwitchDataIfStale error:', err)
//   }
// }

// // ADD these functions to src/app/creator/profile/_actions.ts
// // Also add this import at the top of _actions.ts:
// // import { getYouTubeChannelByHandle, getYouTubeChannelById, getYouTubeChannelStats, isYouTubeDataStale } from '@/lib/youtube'
// /*
// export async function linkYouTubeAccount(formData: FormData) {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   const handle = (formData.get('youtube_handle') as string)?.trim()
//   if (!handle) return { error: 'Please enter a YouTube channel handle' }

//   try {
//     const channel = await getYouTubeChannelByHandle(handle)

//     if (!channel) {
//       return {
//         error: `YouTube channel "${handle}" not found. Try your @handle or channel name.`,
//       }
//     }

//     // Check if already linked to another account
//     const existingLink = await prisma.content_creators.findFirst({
//       where: {
//         youtube_channel_id: channel.id,
//         NOT: { clerk_user_id: userId },
//       },
//     })

//     if (existingLink) {
//       return { error: 'This YouTube channel is already linked to another nx8up profile.' }
//     }

//     // Fetch stats immediately on link
//     const stats = await getYouTubeChannelStats(channel.id)

//     await prisma.content_creators.update({
//       where: { clerk_user_id: userId },
//       data: {
//         youtube_handle: channel.handle,
//         youtube_channel_id: channel.id,
//         youtube_channel_name: channel.title,
//         youtube_subscribers: channel.subscriber_count,
//         youtube_avg_views: stats.avg_views,
//         youtube_top_categories: stats.top_categories,
//         youtube_synced_at: new Date(),
//       },
//     })

//     return {
//       success: true,
//       youtube: {
//         handle: channel.handle,
//         channel_name: channel.title,
//         subscribers: channel.subscriber_count,
//         avg_views: stats.avg_views,
//         top_categories: stats.top_categories,
//       },
//     }
//   } catch (err: any) {
//     console.error('linkYouTubeAccount error:', err)
//     return { error: 'Failed to link YouTube account. Please try again.' }
//   }
// }
// */

// /**
//  * Unlinks the creator's YouTube channel by nulling all YouTube fields on the
//  * `content_creators` DB row.
//  */
// export async function unlinkYouTubeAccount() {
//   const { userId } = await auth()
//   if (!userId) return { error: 'Not authenticated' }

//   try {
//     await prisma.content_creators.update({
//       where: { clerk_user_id: userId },
//       data: {
//         youtube_handle: null,
//         youtube_channel_id: null,
//         youtube_channel_name: null,
//         youtube_subscribers: null,
//         youtube_avg_views: null,
//         youtube_top_categories: [],
//         youtube_synced_at: null,
//       },
//     })

//     return { success: true }
//   } catch (err: any) {
//     console.error('unlinkYouTubeAccount error:', err)
//     return { error: 'Failed to unlink YouTube account.' }
//   }
// }

// /** Try to get a valid YouTube access token, refreshing it if expired. Returns null on failure. */
// async function getValidYouTubeAccessToken(
//   encryptedAccess: string | null,
//   encryptedRefresh: string | null,
//   expiresAt: Date | null,
//   userId: string
// ): Promise<string | null> {
//   if (!encryptedAccess || !encryptedRefresh) return null

//   const now = new Date()
//   const isExpired = !expiresAt || expiresAt <= now

//   if (!isExpired) {
//     return decryptToken(encryptedAccess)
//   }

//   // Token expired — refresh it
//   const refreshToken = decryptToken(encryptedRefresh)
//   if (!refreshToken) return null

//   const res = await fetch('https://oauth2.googleapis.com/token', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({
//       client_id: process.env.GOOGLE_CLIENT_ID!,
//       client_secret: process.env.GOOGLE_CLIENT_SECRET!,
//       refresh_token: refreshToken,
//       grant_type: 'refresh_token',
//     }),
//   })

//   if (!res.ok) return null

//   const data = await res.json()
//   const newAccessToken: string = data.access_token
//   const newExpiresIn: number = data.expires_in ?? 3600

//   // Persist the new access token
//   await prisma.content_creators.update({
//     where: { clerk_user_id: userId },
//     data: {
//       youtube_access_token: encryptToken(newAccessToken),
//       youtube_token_expires_at: new Date(Date.now() + newExpiresIn * 1000),
//     },
//   })

//   return newAccessToken
// }

// /**
//  * Re-fetches YouTube channel stats for the creator identified by `userId`
//  * when the last sync is stale (determined by `isYouTubeDataStale`).
//  *
//  * If the creator has a stored OAuth access token, also fetches:
//  *  - 30-day watch-time hours (YouTube Analytics API).
//  *  - Channel member count (YouTube Data API members endpoint).
//  *  The access token is transparently refreshed via `getValidYouTubeAccessToken`
//  *  when expired, and the new token is persisted to the DB.
//  *
//  * Requires `YOUTUBE_API_KEY` to be set; returns early otherwise.
//  * Swallows all errors — failures are logged but do not surface to the user.
//  *
//  * Env vars: `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
//  */
// export async function refreshYouTubeDataIfStale(userId: string) {
//   if (!process.env.YOUTUBE_API_KEY) return
//   try {
//     const creator = await prisma.content_creators.findUnique({
//       where: { clerk_user_id: userId },
//       select: {
//         youtube_channel_id: true,
//         youtube_synced_at: true,
//         youtube_access_token: true,
//         youtube_refresh_token: true,
//         youtube_token_expires_at: true,
//       },
//     })

//     if (!creator?.youtube_channel_id) return
//     if (!isYouTubeDataStale(creator.youtube_synced_at)) return

//     const [channel, stats] = await Promise.all([
//       getYouTubeChannelById(creator.youtube_channel_id),
//       getYouTubeChannelStats(creator.youtube_channel_id),
//     ])

//     if (!channel) return

//     // Attempt to refresh watch time using stored OAuth token
//     let watchTimeHours: number | null = null
//     const accessToken = await getValidYouTubeAccessToken(
//       creator.youtube_access_token,
//       creator.youtube_refresh_token,
//       creator.youtube_token_expires_at,
//       userId
//     )

//     let memberCount: number | null = null

//     if (accessToken) {
//       const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
//         .toISOString()
//         .split('T')[0]
//       const today = new Date().toISOString().split('T')[0]

//       const [analyticsRes, membersRes] = await Promise.all([
//         fetch(
//           `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${creator.youtube_channel_id}&startDate=${thirtyDaysAgo}&endDate=${today}&metrics=estimatedMinutesWatched&dimensions=day`,
//           { headers: { Authorization: `Bearer ${accessToken}` } }
//         ),
//         fetch(
//           'https://www.googleapis.com/youtube/v3/members?part=snippet&mode=listMembers&maxResults=1',
//           { headers: { Authorization: `Bearer ${accessToken}` } }
//         ),
//       ])

//       if (analyticsRes.ok) {
//         const analyticsData = await analyticsRes.json()
//         const rows: number[][] = analyticsData.rows ?? []
//         const totalMinutes = rows.reduce((sum, row) => sum + (row[1] ?? 0), 0)
//         watchTimeHours = Math.round(totalMinutes / 60)
//       }

//       if (membersRes.ok) {
//         const membersData = await membersRes.json()
//         if (typeof membersData.pageInfo?.totalResults === 'number') {
//           memberCount = membersData.pageInfo.totalResults
//         }
//       }
//     }

//     await prisma.content_creators.update({
//       where: { clerk_user_id: userId },
//       data: {
//         youtube_channel_name: channel.title,
//         youtube_handle: channel.handle,
//         youtube_subscribers: channel.subscriber_count,
//         youtube_avg_views: stats.avg_views || null,
//         youtube_top_categories: stats.top_categories,
//         youtube_synced_at: new Date(),
//         ...(watchTimeHours !== null ? { youtube_watch_time_hours: watchTimeHours } : {}),
//         ...(memberCount !== null ? { youtube_member_count: memberCount } : {}),
//         creator_size: computeCreatorSize(
//           (await prisma.content_creators.findUnique({ where: { clerk_user_id: userId }, select: { subs_followers: true } }))?.subs_followers ?? null,
//           channel.subscriber_count,
//         ) ?? undefined,
//       },
//     })

//     const { recomputeCreatorAggregateCtr } = await import('@/lib/ctr')
//     const updated = await prisma.content_creators.findUnique({
//       where: { clerk_user_id: userId },
//       select: { id: true },
//     })
//     if (updated) {
//       recomputeCreatorAggregateCtr(updated.id).catch(console.error)
//     }
//   } catch (err) {
//     console.error('refreshYouTubeDataIfStale error:', err)
//   }
// }


/**
 * Creator profile server actions.
 *
 * Provides the following operations:
 *
 * - **getCreatorProfile** — reads the creator's profile from a hybrid source:
 *   structured fields (platform, location, game_category, etc.) come from the
 *   `content_creators` DB row; displayName, bio, categories, and urls come
 *   from Clerk `publicMetadata`.
 *
 * - **updateCreatorProfile** — legacy flat-form save; validates URLs, upserts
 *   the DB row, and updates Clerk `publicMetadata`.
 *
 * - **updateCreatorProfileWizard** — wizard-based save; upserts the DB row
 *   with all 7-step fields and recomputes `creator_size` based on follower
 *   counts.
 *
 * - **deleteCreatorProfile** — clears structured fields from both DB and
 *   Clerk metadata (display name, bio, categories, etc.).
 *
 * - **unlinkTwitchAccount** / **unlinkYouTubeAccount** — nulls out the
 *   respective OAuth fields on the DB row.
 *
 * - **refreshTwitchDataIfStale** — re-fetches Twitch stats (followers, VOD
 *   views) from the Twitch API when the last sync is older than the staleness
 *   window. Recomputes `creator_size` and CTR aggregate afterward.
 *
 * - **refreshYouTubeDataIfStale** — re-fetches YouTube channel stats; also
 *   attempts to refresh watch-time and member-count data using the stored
 *   OAuth access token (refreshing it via the Google token endpoint if expired).
 *
 * Commented-out functions (`linkTwitchAccount`, `linkYouTubeAccount`) are
 * the manual-link flows that predate OAuth; they are preserved as reference.
 *
 * External services: Clerk (auth + publicMetadata), Prisma/PostgreSQL,
 * Twitch Helix API, YouTube Data API v3, YouTube Analytics API,
 * Google OAuth2 token endpoint.
 *
 * Env vars:
 *  - `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
 *  - `YOUTUBE_API_KEY`
 *  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
 *
 * Gotcha: `refreshYouTubeDataIfStale` performs an extra DB query inside the
 * `creator_size` computation within the main update call (lines ~666-669),
 * resulting in two sequential DB hits. This could be collapsed into one.
 */
'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { CreatorProfile } from '@/lib/creator-profile'
import { prisma } from '@/lib/prisma'
import { parseLocation } from '@/lib/location-options'
import { computeCreatorSize } from '@/lib/matching'
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
import { decryptToken, encryptToken } from '@/lib/token-encryption'

/**
 * Validates a URL string, prepending `https://` if no protocol is present.
 * Accepts `localhost` and any hostname containing a dot.
 * Returns `false` for empty, null-ish, or malformed inputs.
 */
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

/**
 * Joins non-empty city, state, and country values with ", " to produce a
 * human-readable location string stored in the `location` DB column.
 */
function formatLocationString(city: string, state: string, country: string): string {
  const parts = [city.trim(), state.trim(), country.trim()].filter(Boolean)
  return parts.join(', ')
}

/**
 * Fetches the current creator profile for the authenticated user.
 * Data is merged from two sources:
 *  - Clerk `publicMetadata`: displayName, bio, categories, urls.
 *  - `content_creators` DB row: all structured fields (location, platform,
 *    language, audience demographics, etc.).
 *
 * Returns `null` for unauthenticated users.
 */
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
    // Audience demographics
    audience_age_min: fromDb?.audience_age_min ?? undefined,
    audience_age_max: fromDb?.audience_age_max ?? undefined,
    audience_locations: fromDb?.audience_locations?.length ? fromDb.audience_locations : undefined,
    audience_gender: fromDb?.audience_gender?.length ? fromDb.audience_gender : undefined,
    // Creator identity
    creator_types: fromDb?.creator_types?.length ? fromDb.creator_types : undefined,
    primary_platform: fromDb?.primary_platform ?? undefined,
    // Content & audience tags
    content_style: fromDb?.content_style?.length ? fromDb.content_style : undefined,
    audience_interests: fromDb?.audience_interests?.length ? fromDb.audience_interests : undefined,
    // Brand & campaign preferences
    preferred_campaign_types: fromDb?.preferred_campaign_types?.length ? fromDb.preferred_campaign_types : undefined,
    preferred_product_types: fromDb?.preferred_product_types?.length ? fromDb.preferred_product_types : undefined,
    // Eligibility
    is_available: fromDb?.is_available ?? undefined,
    max_campaigns_per_month: fromDb?.max_campaigns_per_month ?? undefined,
  }
}

/**
 * Saves the legacy flat-form profile. Validates all provided URLs, upserts
 * the `content_creators` DB row, and writes displayName/bio/categories/urls
 * to Clerk `publicMetadata`. Revalidates `/creator`, `/creator/profile`, and
 * `/admin` on success.
 */
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
    const most_played_games = data.most_played_games?.length ? data.most_played_games : []
    const audience_locations = data.audience_locations?.length ? data.audience_locations : []

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
        audience_age_min: data.audience_age_min ?? undefined,
        audience_age_max: data.audience_age_max ?? undefined,
        audience_locations,
      },
      update: {
        location: locationStr || undefined,
        platform,
        game_category,
        language,
        content_type,
        updated_at: new Date(),
        audience_age_min: data.audience_age_min ?? null,
        audience_age_max: data.audience_age_max ?? null,
        audience_locations,
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

/**
 * Wizard save action — upserts the full `CreatorProfileDraft` into the DB
 * and writes displayName/bio to Clerk `publicMetadata`. Also recomputes
 * `creator_size` from the latest follower counts stored in the DB.
 * Called on every "Save & Continue" step in the wizard.
 */
export async function updateCreatorProfileWizard(data: import('./_shared').CreatorProfileDraft): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress ?? ''
    const existing = (user.publicMetadata || {}) as Record<string, unknown>

    const locationStr = [data.city.trim(), data.state.trim(), data.country.trim()].filter(Boolean).join(', ')

    // Fetch current follower counts to compute creator_size
    const existing_cc = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: { subs_followers: true, youtube_subscribers: true },
    })
    const creator_size = computeCreatorSize(
      existing_cc?.subs_followers ?? null,
      existing_cc?.youtube_subscribers ?? null,
    )

    await prisma.content_creators.upsert({
      where: { clerk_user_id: userId },
      create: {
        clerk_user_id: userId,
        email,
        location: locationStr || undefined,
        language: data.language,
        platform: data.platform,
        game_category: data.game_category,
        content_type: data.content_type,
        audience_age_min: data.audience_age_min ? parseInt(data.audience_age_min, 10) : undefined,
        audience_age_max: data.audience_age_max ? parseInt(data.audience_age_max, 10) : undefined,
        audience_locations: data.audience_locations,
        audience_gender: data.audience_gender,
        creator_types: data.creator_types,
        primary_platform: data.primary_platform || null,
        content_style: data.content_style,
        audience_interests: data.audience_interests,
        preferred_campaign_types: data.preferred_campaign_types,
        preferred_product_types: data.preferred_product_types,
        is_available: data.is_available,
        max_campaigns_per_month: data.max_campaigns_per_month ? parseInt(data.max_campaigns_per_month, 10) : undefined,
        ...(creator_size ? { creator_size } : {}),
      },
      update: {
        location: locationStr || null,
        language: data.language,
        platform: data.platform,
        game_category: data.game_category,
        content_type: data.content_type,
        audience_age_min: data.audience_age_min ? parseInt(data.audience_age_min, 10) : null,
        audience_age_max: data.audience_age_max ? parseInt(data.audience_age_max, 10) : null,
        audience_locations: data.audience_locations,
        audience_gender: data.audience_gender,
        creator_types: data.creator_types,
        primary_platform: data.primary_platform || null,
        content_style: data.content_style,
        audience_interests: data.audience_interests,
        preferred_campaign_types: data.preferred_campaign_types,
        preferred_product_types: data.preferred_product_types,
        is_available: data.is_available,
        max_campaigns_per_month: data.max_campaigns_per_month ? parseInt(data.max_campaigns_per_month, 10) : null,
        ...(creator_size ? { creator_size } : {}),
        updated_at: new Date(),
      },
    })

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...existing,
        displayName: data.displayName.trim() || undefined,
        bio: data.bio.trim() || undefined,
      },
    })

    revalidatePath('/creator')
    revalidatePath('/creator/profile')
    revalidatePath('/admin')
    return {}
  } catch {
    return { error: 'Failed to save profile' }
  }
}

/**
 * Clears the creator's profile data from both Clerk `publicMetadata` and the
 * `content_creators` DB row. OAuth connection fields (twitch_id, etc.) are
 * NOT cleared — only the manually entered profile fields.
 *
 * Gotcha: uses `updateMany` (not `update`) in case no DB row exists yet for
 * the user, which silently no-ops rather than throwing.
 */
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
        audience_age_min: null,
        audience_age_max: null,
        audience_locations: [],
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

/*
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
      return { error: 'This Twitch account is already linked to another nx8up profile.' }
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
        average_vod_views: streamStats.average_vod_views,
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
*/

/**
 * Unlinks the creator's Twitch account by nulling all Twitch fields on the
 * `content_creators` DB row. Does NOT remove Twitch stats from the DB —
 * follower counts and VOD views are left as-is until overwritten on next link.
 */
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

export async function linkSteamAccount(data: {
  steam_id: string
  steam_username: string
  steam_profile_url: string
  steam_avatar_url: string
  steam_profile_visibility: number
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        steam_id: data.steam_id,
        steam_username: data.steam_username,
        steam_profile_url: data.steam_profile_url,
        steam_avatar_url: data.steam_avatar_url,
        steam_profile_visibility: data.steam_profile_visibility,
        steam_synced_at: new Date(),
        updated_at: new Date(),
      },
    })
    revalidatePath('/creator/profile')
    return { success: true }
  } catch (err: any) {
    console.error('linkSteamAccount error:', err)
    return { error: 'Failed to save Steam account.' }
  }
}

export async function unlinkSteamAccount() {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        steam_id: null,
        steam_username: null,
        steam_profile_url: null,
        steam_avatar_url: null,
        steam_profile_visibility: null,
        steam_synced_at: null,
        updated_at: new Date(),
      },
    })
    revalidatePath('/creator/profile')
    return { success: true }
  } catch (err: any) {
    console.error('unlinkSteamAccount error:', err)
    return { error: 'Failed to unlink Steam account.' }
  }
}

/**
 * Re-fetches Twitch stats for the creator identified by `userId` when the
 * last sync timestamp is considered stale (determined by `isTwitchDataStale`).
 *
 * Lookback window for VOD stats: 60 days for partners, 14 days for others.
 *
 * On success: updates followers, broadcaster type, profile image, avg VOD
 * views, `twitch_synced_at`, and recomputes `creator_size` and CTR aggregate.
 *
 * Swallows all errors — failures are logged but do not surface to the user.
 * This function is called fire-and-forget from the profile page.
 */
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

    const twitchCreator = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: { youtube_subscribers: true },
    })
    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        twitch_username: twitchUser.login,
        twitch_broadcaster_type: twitchUser.broadcaster_type,
        twitch_description: twitchUser.description,
        twitch_profile_image: twitchUser.profile_image_url,
        twitch_synced_at: new Date(),
        subs_followers: followerCount,
        average_vod_views: streamStats.average_vod_views,
        creator_size: computeCreatorSize(followerCount, twitchCreator?.youtube_subscribers ?? null) ?? undefined,
      },
    })

    const { recomputeCreatorAggregateCtr } = await import('@/lib/ctr')
    const updated = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: { id: true },
    })
    if (updated) {
      recomputeCreatorAggregateCtr(updated.id).catch(console.error)
    }
  } catch (err) {
    console.error('refreshTwitchDataIfStale error:', err)
  }
}

// ADD these functions to src/app/creator/profile/_actions.ts
// Also add this import at the top of _actions.ts:
// import { getYouTubeChannelByHandle, getYouTubeChannelById, getYouTubeChannelStats, isYouTubeDataStale } from '@/lib/youtube'
/*
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
      return { error: 'This YouTube channel is already linked to another nx8up profile.' }
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
*/

/**
 * Unlinks the creator's YouTube channel by nulling all YouTube fields on the
 * `content_creators` DB row.
 */
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

/** Try to get a valid YouTube access token, refreshing it if expired. Returns null on failure. */
async function getValidYouTubeAccessToken(
  encryptedAccess: string | null,
  encryptedRefresh: string | null,
  expiresAt: Date | null,
  userId: string
): Promise<string | null> {
  if (!encryptedAccess || !encryptedRefresh) return null

  const now = new Date()
  const isExpired = !expiresAt || expiresAt <= now

  if (!isExpired) {
    return decryptToken(encryptedAccess)
  }

  // Token expired — refresh it
  const refreshToken = decryptToken(encryptedRefresh)
  if (!refreshToken) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) return null

  const data = await res.json()
  const newAccessToken: string = data.access_token
  const newExpiresIn: number = data.expires_in ?? 3600

  // Persist the new access token
  await prisma.content_creators.update({
    where: { clerk_user_id: userId },
    data: {
      youtube_access_token: encryptToken(newAccessToken),
      youtube_token_expires_at: new Date(Date.now() + newExpiresIn * 1000),
    },
  })

  return newAccessToken
}

/**
 * Re-fetches YouTube channel stats for the creator identified by `userId`
 * when the last sync is stale (determined by `isYouTubeDataStale`).
 *
 * If the creator has a stored OAuth access token, also fetches:
 *  - 30-day watch-time hours (YouTube Analytics API).
 *  - Channel member count (YouTube Data API members endpoint).
 *  The access token is transparently refreshed via `getValidYouTubeAccessToken`
 *  when expired, and the new token is persisted to the DB.
 *
 * Requires `YOUTUBE_API_KEY` to be set; returns early otherwise.
 * Swallows all errors — failures are logged but do not surface to the user.
 *
 * Env vars: `YOUTUBE_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
 */
export async function refreshYouTubeDataIfStale(userId: string) {
  if (!process.env.YOUTUBE_API_KEY) return
  try {
    const creator = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: {
        youtube_channel_id: true,
        youtube_synced_at: true,
        youtube_access_token: true,
        youtube_refresh_token: true,
        youtube_token_expires_at: true,
      },
    })

    if (!creator?.youtube_channel_id) return
    if (!isYouTubeDataStale(creator.youtube_synced_at)) return

    const [channel, stats] = await Promise.all([
      getYouTubeChannelById(creator.youtube_channel_id),
      getYouTubeChannelStats(creator.youtube_channel_id),
    ])

    if (!channel) return

    // Attempt to refresh watch time using stored OAuth token
    let watchTimeHours: number | null = null
    const accessToken = await getValidYouTubeAccessToken(
      creator.youtube_access_token,
      creator.youtube_refresh_token,
      creator.youtube_token_expires_at,
      userId
    )

    let memberCount: number | null = null

    if (accessToken) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const today = new Date().toISOString().split('T')[0]

      const [analyticsRes, membersRes] = await Promise.all([
        fetch(
          `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${creator.youtube_channel_id}&startDate=${thirtyDaysAgo}&endDate=${today}&metrics=estimatedMinutesWatched&dimensions=day`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ),
        fetch(
          'https://www.googleapis.com/youtube/v3/members?part=snippet&mode=listMembers&maxResults=1',
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ),
      ])

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        const rows: number[][] = analyticsData.rows ?? []
        const totalMinutes = rows.reduce((sum, row) => sum + (row[1] ?? 0), 0)
        watchTimeHours = Math.round(totalMinutes / 60)
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        if (typeof membersData.pageInfo?.totalResults === 'number') {
          memberCount = membersData.pageInfo.totalResults
        }
      }
    }

    await prisma.content_creators.update({
      where: { clerk_user_id: userId },
      data: {
        youtube_channel_name: channel.title,
        youtube_handle: channel.handle,
        youtube_subscribers: channel.subscriber_count,
        youtube_avg_views: stats.avg_views || null,
        youtube_top_categories: stats.top_categories,
        youtube_synced_at: new Date(),
        ...(watchTimeHours !== null ? { youtube_watch_time_hours: watchTimeHours } : {}),
        ...(memberCount !== null ? { youtube_member_count: memberCount } : {}),
        creator_size: computeCreatorSize(
          (await prisma.content_creators.findUnique({ where: { clerk_user_id: userId }, select: { subs_followers: true } }))?.subs_followers ?? null,
          channel.subscriber_count,
        ) ?? undefined,
      },
    })

    const { recomputeCreatorAggregateCtr } = await import('@/lib/ctr')
    const updated = await prisma.content_creators.findUnique({
      where: { clerk_user_id: userId },
      select: { id: true },
    })
    if (updated) {
      recomputeCreatorAggregateCtr(updated.id).catch(console.error)
    }
  } catch (err) {
    console.error('refreshYouTubeDataIfStale error:', err)
  }
}