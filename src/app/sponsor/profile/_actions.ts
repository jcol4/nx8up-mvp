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
  preferred_payment_method: string
  age_restricted: boolean
  age_restriction_type: string | null
  has_pending_age_restriction_request: boolean
}

export async function getSponsorProfile(): Promise<SponsorProfile | null> {
  const { userId } = await auth()
  if (!userId) return null

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    include: {
      age_restriction_requests: {
        where: { status: 'pending' },
        take: 1,
      },
    },
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
    preferred_payment_method: sponsor.preferred_payment_method ?? 'card',
    age_restricted: sponsor.age_restricted,
    age_restriction_type: sponsor.age_restriction_type ?? null,
    has_pending_age_restriction_request: sponsor.age_restriction_requests.length > 0,
  }
}

export async function updateSponsorProfile(
  data: Omit<SponsorProfile, 'age_restricted' | 'age_restriction_type' | 'has_pending_age_restriction_request'> & { preferred_payment_method: string }
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
        preferred_payment_method: data.preferred_payment_method,
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
        preferred_payment_method: data.preferred_payment_method,
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

export async function requestAgeRestrictionChange(data: {
  requested_age_restricted: boolean
  requested_age_restriction_type: string | null
  sponsor_message: string
}): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  if (!data.sponsor_message.trim()) {
    return { error: 'Please provide a message explaining the reason for this change.' }
  }

  if (data.requested_age_restricted && !data.requested_age_restriction_type) {
    return { error: 'Please select an age restriction type (18+ or 21+).' }
  }

  try {
    const sponsor = await prisma.sponsors.findUnique({
      where: { clerk_user_id: userId },
      select: { id: true },
    })
    if (!sponsor) return { error: 'Sponsor profile not found.' }

    // Upsert: update existing pending request or create a new one
    const existing = await prisma.sponsor_age_restriction_requests.findFirst({
      where: { sponsor_id: sponsor.id, status: 'pending' },
    })

    if (existing) {
      await prisma.sponsor_age_restriction_requests.update({
        where: { id: existing.id },
        data: {
          requested_age_restricted: data.requested_age_restricted,
          requested_age_restriction_type: data.requested_age_restriction_type,
          sponsor_message: data.sponsor_message.trim(),
        },
      })
    } else {
      await prisma.sponsor_age_restriction_requests.create({
        data: {
          sponsor_id: sponsor.id,
          requested_age_restricted: data.requested_age_restricted,
          requested_age_restriction_type: data.requested_age_restriction_type,
          sponsor_message: data.sponsor_message.trim(),
          status: 'pending',
        },
      })
    }

    revalidatePath('/sponsor/profile')
    return {}
  } catch {
    return { error: 'Failed to submit change request.' }
  }
}
