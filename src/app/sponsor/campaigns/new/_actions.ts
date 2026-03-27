'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

export type CreateCampaignResult = { error?: string; success?: boolean; id?: string }

const VALID_OBJECTIVES = ['awareness', 'engagement', 'traffic', 'conversions'] as const
const VALID_CAMPAIGN_TYPES = ['one_time', 'ongoing', 'milestone_based'] as const
const VALID_PAYMENT_MODELS = ['fixed_per_creator', 'performance_based', 'hybrid'] as const

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

function generateCampaignCode(): string {
  return 'NX-' + randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

export async function createCampaign(formData: FormData): Promise<CreateCampaignResult> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({ where: { clerk_user_id: userId } })
  if (!sponsor) return { error: 'Sponsor profile not found.' }

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Campaign name is required.' }

  const brand_name = (formData.get('brand_name') as string)?.trim()
  if (!brand_name) return { error: 'Brand / Company name is required.' }

  const objective = (formData.get('objective') as string)?.trim()
  if (!objective || !VALID_OBJECTIVES.includes(objective as typeof VALID_OBJECTIVES[number])) {
    return { error: 'A valid campaign objective is required.' }
  }

  const campaign_type = (formData.get('campaign_type') as string)?.trim()
  if (!campaign_type || !VALID_CAMPAIGN_TYPES.includes(campaign_type as typeof VALID_CAMPAIGN_TYPES[number])) {
    return { error: 'A valid campaign type is required.' }
  }

  const payment_model = (formData.get('payment_model') as string)?.trim()
  if (!payment_model || !VALID_PAYMENT_MODELS.includes(payment_model as typeof VALID_PAYMENT_MODELS[number])) {
    return { error: 'A valid payment model is required.' }
  }

  const budgetRaw = (formData.get('budget') as string | null)?.trim() ?? ''
  if (!budgetRaw) return { error: 'Total budget is required.' }
  const budgetNumber = Number(budgetRaw)
  if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
    return { error: 'Budget must be a positive number.' }
  }

  const startDateRaw = formData.get('start_date') as string | null
  const start_date = parseOptionalDate(startDateRaw)
  if (!start_date) return { error: 'Start date is required.' }

  const endDateRaw = formData.get('end_date') as string | null
  const end_date = parseOptionalDate(endDateRaw)
  if (!end_date) return { error: 'End date is required.' }

  if (end_date <= start_date) return { error: 'End date must be after start date.' }

  const description = (formData.get('description') as string | null)?.trim() ?? null
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
      campaign_code: generateCampaignCode(),
      sponsor_id: sponsor.id,
      status: 'draft',
      title,
      brand_name,
      description: description || null,
      objective,
      campaign_type,
      payment_model,
      budget: budgetNumber,
      start_date,
      end_date,
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
