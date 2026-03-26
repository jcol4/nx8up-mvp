'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export type CreateCampaignResult = { error?: string; success?: boolean; id?: string }

function parseOptionalInt(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

function parseOptionalDate(value: string | null): Date | null {
  if (value == null || value.trim() === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseStringArray(value: string | null): string[] {
  if (value == null || value.trim() === '') return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export async function createCampaign(formData: FormData): Promise<CreateCampaignResult> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return { error: 'Sponsor profile not found.' }

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Campaign title is required.' }
  
  const descriptionRaw = (formData.get('description') as string | null)?.trim() ?? ''
  if (!descriptionRaw) {
    return { error: 'Description is required.' }
  }
  const description = descriptionRaw
  
  const budgetRaw = (formData.get('budget') as string | null)?.trim() ?? ''
  if (!budgetRaw) {
    return { error: 'Budget is required.' }
  }
  const budgetNumber = Number(budgetRaw)
  if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
    return { error: 'Budget must be a positive number.' }
  }
  const deadline = parseOptionalDate(formData.get('deadline') as string | null)
  const platform = parseStringArray(formData.get('platform') as string | null)
  const content_type = parseStringArray(formData.get('content_type') as string | null)
  const game_category = parseStringArray(formData.get('game_category') as string | null)
  const min_avg_viewers = parseOptionalInt(formData.get('min_avg_viewers') as string | null)
  const min_subs_followers = parseOptionalInt(formData.get('min_subs_followers') as string | null)
  const min_audience_age = parseOptionalInt(formData.get('min_audience_age') as string | null)
  const max_audience_age = parseOptionalInt(formData.get('max_audience_age') as string | null)
  const required_audience_locations = parseStringArray(formData.get('required_audience_locations') as string | null)

  const campaign = await prisma.campaigns.create({
    data: {
      sponsor_id: sponsor.id,
      status: 'active',
      title,
      description,
      budget: budgetNumber,
      deadline,
      platform,
      content_type,
      game_category,
      min_avg_viewers,
      min_subs_followers,
      min_audience_age,
      max_audience_age,
      required_audience_locations,
      creative_package: [],
    },
  })

  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  return { success: true, id: campaign.id }
}
