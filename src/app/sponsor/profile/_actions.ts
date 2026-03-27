'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { parseLocation, formatLocation } from '@/lib/location-options'

export type SponsorProfile = {
  company_name: string
  country: string
  state: string
  city: string
  language: string[]
  platform: string[]
  content_type: string[]
  game_category: string[]
  budget_min: number | null
  budget_max: number | null
  min_avg_viewers: number | null
  min_subs_followers: number | null
  min_engagement_rate: number | null
}

export async function getSponsorProfile(): Promise<SponsorProfile | null> {
  const { userId } = await auth()
  if (!userId) return null

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
  })

  if (!sponsor) return null

  const { city, state, country } = parseLocation(sponsor.location ?? undefined)

  return {
    company_name: sponsor.company_name ?? '',
    country,
    state,
    city,
    language: sponsor.language ?? [],
    platform: sponsor.platform ?? [],
    content_type: sponsor.content_type ?? [],
    game_category: sponsor.game_category ?? [],
    budget_min: sponsor.budget_min ?? null,
    budget_max: sponsor.budget_max ?? null,
    min_avg_viewers: sponsor.min_avg_viewers ?? null,
    min_subs_followers: sponsor.min_subs_followers ?? null,
    min_engagement_rate: sponsor.min_engagement_rate ? Number(sponsor.min_engagement_rate) : null,
  }
}

export async function updateSponsorProfile(
  data: SponsorProfile
): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  try {
    const locationStr = formatLocation(data.city, data.state, data.country)

    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const email = user.emailAddresses[0]?.emailAddress ?? ''

    await prisma.sponsors.upsert({
      where: { clerk_user_id: userId },
      create: {
        clerk_user_id: userId,
        email,
        company_name: data.company_name.trim() || null,
        location: locationStr || null,
        language: data.language,
        platform: data.platform,
        content_type: data.content_type,
        game_category: data.game_category,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        min_avg_viewers: data.min_avg_viewers,
        min_subs_followers: data.min_subs_followers,
        min_engagement_rate: data.min_engagement_rate,
      },
      update: {
        company_name: data.company_name.trim() || null,
        location: locationStr || null,
        language: data.language,
        platform: data.platform,
        content_type: data.content_type,
        game_category: data.game_category,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        min_avg_viewers: data.min_avg_viewers,
        min_subs_followers: data.min_subs_followers,
        min_engagement_rate: data.min_engagement_rate,
        updated_at: new Date(),
      },
    })

    revalidatePath('/sponsor')
    revalidatePath('/sponsor/profile')
    return {}
  } catch {
    return { error: 'Failed to update profile' }
  }
}
