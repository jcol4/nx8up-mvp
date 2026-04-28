'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { sponsorDashboardCacheTag } from '@/lib/sponsor-dashboard-cache'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { BUDGET_MAX } from '@/lib/constants'
import { createNotification } from '@/lib/notifications'
import { NOTIFICATION_TYPES } from '@/lib/notification-types'

export type CreateCampaignResult = { error?: string; success?: boolean; id?: string }

const VALID_OBJECTIVES = ['awareness', 'engagement', 'traffic', 'conversions'] as const
const VALID_PAYMENT_MODELS = ['fixed_per_creator', 'performance_based', 'hybrid'] as const
const VALID_PRODUCT_TYPES = ['consumable', 'gaming_hardware', 'digital_product', 'fashion_lifestyle', 'event_experience'] as const
const VALID_CAMPAIGN_TYPES = ['use_and_show', 'explain_and_demo', 'mention_and_repeat', 'compete_and_feature'] as const

function parseOptionalInt(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const n = parseInt(value, 10)
  return Number.isNaN(n) ? null : n
}

function parseOptionalFloat(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const n = parseFloat(value)
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

function parseBool(value: string | null): boolean {
  return value === 'true'
}

function generateCampaignCode(): string {
  return 'NX-' + randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

export async function saveCampaignDraft(formData: FormData): Promise<CreateCampaignResult> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, age_restriction_type: true },
  })
  if (!sponsor) return { error: 'Sponsor profile not found.' }

  const existingId = (formData.get('draft_id') as string | null)?.trim() || null

  const title = (formData.get('title') as string)?.trim() || 'Untitled Campaign'
  const budgetRaw = (formData.get('budget') as string | null)?.trim() ?? ''
  const budgetNumber = budgetRaw ? Number(budgetRaw) : null
  const budget = budgetNumber && Number.isFinite(budgetNumber) && budgetNumber > 0
    ? Math.min(budgetNumber, BUDGET_MAX)
    : null
  const start_date = parseOptionalDate(formData.get('start_date') as string | null)
  const end_date = parseOptionalDate(formData.get('end_date') as string | null)

  const legalAgeRestriction = sponsor.age_restriction_type ?? null

  const is_direct_invite = parseBool(formData.get('is_direct_invite') as string | null)

  const draftData = {
    title,
    is_direct_invite,
    legal_age_restriction: legalAgeRestriction,
    brand_name: (formData.get('brand_name') as string | null)?.trim() || null,
    product_name: (formData.get('product_name') as string | null)?.trim() || null,
    product_type: (formData.get('product_type') as string | null)?.trim() || null,
    objective: (formData.get('objective') as string | null)?.trim() || null,
    campaign_type: (formData.get('campaign_type') as string | null)?.trim() || null,
    payment_model: (formData.get('payment_model') as string | null)?.trim() || 'fixed_per_creator',
    preferred_payment_method: (['card', 'ach', 'both'].includes((formData.get('preferred_payment_method') as string) ?? '') ? formData.get('preferred_payment_method') as string : 'card'),
    budget,
    start_date: start_date && end_date && start_date < end_date ? start_date : null,
    end_date: start_date && end_date && start_date < end_date ? end_date : null,
    platform: parseStringArray(formData.get('platform') as string | null),
    game_category: parseStringArray(formData.get('target_interests') as string | null),
    min_audience_age: parseOptionalInt(formData.get('audience_age_min') as string | null),
    max_audience_age: parseOptionalInt(formData.get('audience_age_max') as string | null),
    target_genders: parseStringArray(formData.get('target_genders') as string | null),
    required_audience_locations: parseStringArray(formData.get('required_audience_locations') as string | null),
    target_cities: (formData.get('target_cities') as string | null)?.trim() || null,
    target_interests: parseStringArray(formData.get('target_interests') as string | null),
    creator_types: parseStringArray(formData.get('creator_types') as string | null),
    creator_sizes: parseStringArray(formData.get('creator_sizes') as string | null),
    creator_count: parseOptionalInt(formData.get('creator_count') as string | null),
    min_subs_followers: parseOptionalInt(formData.get('min_subs_followers') as string | null),
    min_engagement_rate: parseOptionalFloat(formData.get('min_engagement_rate') as string | null),
    num_videos: parseOptionalInt(formData.get('num_videos') as string | null),
    video_includes: parseStringArray(formData.get('video_includes') as string | null),
    num_youtube_shorts: parseOptionalInt(formData.get('num_youtube_shorts') as string | null),
    num_streams: parseOptionalInt(formData.get('num_streams') as string | null),
    num_twitch_clips: parseOptionalInt(formData.get('num_twitch_clips') as string | null),
    min_stream_duration: parseOptionalInt(formData.get('min_stream_duration') as string | null),
    num_posts: parseOptionalInt(formData.get('num_posts') as string | null),
    num_short_videos: parseOptionalInt(formData.get('num_short_videos') as string | null),
    content_type: parseStringArray(formData.get('accepted_media_types') as string | null),
    content_guidelines: (formData.get('content_guidelines') as string | null)?.trim() || null,
    must_include_link: parseBool(formData.get('must_include_link') as string | null),
    must_include_promo_code: parseBool(formData.get('must_include_promo_code') as string | null),
    must_tag_brand: parseBool(formData.get('must_tag_brand') as string | null),
    landing_page_url: (formData.get('landing_page_url') as string | null)?.trim() || null,
    tracking_type: (formData.get('tracking_type') as string | null)?.trim() || null,
    conversion_goal: (formData.get('conversion_goal') as string | null)?.trim() || null,
    updated_at: new Date(),
  }

  let campaignId: string

  if (existingId) {
    // Verify the draft belongs to this sponsor before updating
    const existing = await prisma.campaigns.findFirst({
      where: { id: existingId, sponsor_id: sponsor.id, status: 'draft' },
      select: { id: true },
    })
    if (!existing) return { error: 'Draft not found.' }

    await prisma.campaigns.update({ where: { id: existingId }, data: draftData })
    campaignId = existingId
  } else {
    const campaign = await prisma.campaigns.create({
      data: {
        ...draftData,
        campaign_code: generateCampaignCode(),
        sponsor_id: sponsor.id,
        status: 'draft',
        creative_package: [],
      },
    })
    campaignId = campaign.id
  }

  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  revalidateTag(sponsorDashboardCacheTag(sponsor.id))
  return { success: true, id: campaignId }
}

export async function createCampaign(formData: FormData): Promise<CreateCampaignResult> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, age_restriction_type: true },
  })
  if (!sponsor) return { error: 'Sponsor profile not found.' }

  // Step 1
  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Campaign name is required.' }

  const product_type = (formData.get('product_type') as string)?.trim()
  if (!product_type || !VALID_PRODUCT_TYPES.includes(product_type as typeof VALID_PRODUCT_TYPES[number])) {
    return { error: 'A valid product type is required.' }
  }

  const objective = (formData.get('objective') as string)?.trim()
  if (!objective || !VALID_OBJECTIVES.includes(objective as typeof VALID_OBJECTIVES[number])) {
    return { error: 'A valid campaign goal is required.' }
  }

  const platform = parseStringArray(formData.get('platform') as string | null)
  if (!platform.length) return { error: 'At least one platform is required.' }

  // Step 4
  const budgetRaw = (formData.get('budget') as string | null)?.trim() ?? ''
  if (!budgetRaw) return { error: 'Total budget is required.' }
  const budgetNumber = Number(budgetRaw)
  if (!Number.isFinite(budgetNumber) || budgetNumber <= 0) {
    return { error: 'Budget must be a positive number.' }
  }
  if (budgetNumber > BUDGET_MAX) {
    return { error: `Budget cannot exceed $${BUDGET_MAX.toLocaleString()} — Stripe's ACH debit limit.` }
  }

  const startDateRaw = formData.get('start_date') as string | null
  const start_date = parseOptionalDate(startDateRaw)
  if (!start_date) return { error: 'Start date is required.' }

  const endDateRaw = formData.get('end_date') as string | null
  const end_date = parseOptionalDate(endDateRaw)
  if (!end_date) return { error: 'End date is required.' }
  if (end_date <= start_date) return { error: 'End date must be after start date.' }

  // Step 5
  const campaign_type = (formData.get('campaign_type') as string)?.trim()
  if (!campaign_type || !VALID_CAMPAIGN_TYPES.includes(campaign_type as typeof VALID_CAMPAIGN_TYPES[number])) {
    return { error: 'A valid campaign type / mission is required.' }
  }

  const payment_model = (formData.get('payment_model') as string)?.trim() || 'fixed_per_creator'
  if (!VALID_PAYMENT_MODELS.includes(payment_model as typeof VALID_PAYMENT_MODELS[number])) {
    return { error: 'Invalid payment model.' }
  }

  const preferred_payment_method_raw = (formData.get('preferred_payment_method') as string)?.trim()
  const preferred_payment_method = ['card', 'ach', 'both'].includes(preferred_payment_method_raw)
    ? preferred_payment_method_raw
    : 'card'

  // Optional fields
  const brand_name = (formData.get('brand_name') as string | null)?.trim() ?? null
  const product_name = (formData.get('product_name') as string | null)?.trim() ?? null
  const content_guidelines = (formData.get('content_guidelines') as string | null)?.trim() ?? null
  const target_cities = (formData.get('target_cities') as string | null)?.trim() ?? null
  const landing_page_url = (formData.get('landing_page_url') as string | null)?.trim() ?? null
  const tracking_type = (formData.get('tracking_type') as string | null)?.trim() ?? null
  const conversion_goal = (formData.get('conversion_goal') as string | null)?.trim() ?? null

  const creator_count = parseOptionalInt(formData.get('creator_count') as string | null)
  const min_subs_followers = parseOptionalInt(formData.get('min_subs_followers') as string | null)
  const min_engagement_rate = parseOptionalFloat(formData.get('min_engagement_rate') as string | null)
  const num_videos = parseOptionalInt(formData.get('num_videos') as string | null)
  const num_youtube_shorts = parseOptionalInt(formData.get('num_youtube_shorts') as string | null)
  const num_streams = parseOptionalInt(formData.get('num_streams') as string | null)
  const num_twitch_clips = parseOptionalInt(formData.get('num_twitch_clips') as string | null)
  const min_stream_duration = parseOptionalInt(formData.get('min_stream_duration') as string | null)
  const num_posts = parseOptionalInt(formData.get('num_posts') as string | null)
  const num_short_videos = parseOptionalInt(formData.get('num_short_videos') as string | null)

  const legalAgeRestriction = sponsor.age_restriction_type ?? null
  const restrictionMinAge =
    legalAgeRestriction === '21+' ? 21 : legalAgeRestriction === '18+' ? 18 : null

  const min_audience_age = parseOptionalInt(formData.get('audience_age_min') as string | null)
  const max_audience_age = parseOptionalInt(formData.get('audience_age_max') as string | null)

  if (restrictionMinAge !== null) {
    if (min_audience_age === null || min_audience_age < restrictionMinAge) {
      return {
        error: `Your account has a ${legalAgeRestriction} age restriction. The minimum audience age must be at least ${restrictionMinAge}.`,
      }
    }
  }

  const target_genders = parseStringArray(formData.get('target_genders') as string | null)
  const required_audience_locations = parseStringArray(formData.get('required_audience_locations') as string | null)
  const target_interests = parseStringArray(formData.get('target_interests') as string | null)
  const creator_types = parseStringArray(formData.get('creator_types') as string | null)
  const creator_sizes = parseStringArray(formData.get('creator_sizes') as string | null)
  const video_includes = parseStringArray(formData.get('video_includes') as string | null)

  const must_include_link = parseBool(formData.get('must_include_link') as string | null)
  const must_include_promo_code = parseBool(formData.get('must_include_promo_code') as string | null)
  const must_tag_brand = parseBool(formData.get('must_tag_brand') as string | null)
  const is_direct_invite = parseBool(formData.get('is_direct_invite') as string | null)
  const invited_creator_id = (formData.get('invited_creator_id') as string | null)?.trim() || null

  if (is_direct_invite) {
    if (!invited_creator_id) return { error: 'Please select a creator to invite.' }
    const invitedCreator = await prisma.content_creators.findUnique({
      where: { id: invited_creator_id },
      select: { id: true, clerk_user_id: true },
    })
    if (!invitedCreator) return { error: 'Selected creator not found.' }
  }

  const campaignData = {
    title,
    is_direct_invite,
    legal_age_restriction: legalAgeRestriction,
    brand_name,
    product_name,
    product_type,
    objective,
    campaign_type,
    payment_model,
    preferred_payment_method,
    budget: budgetNumber,
    start_date,
    end_date,
    platform,
    game_category: target_interests,
    min_audience_age,
    max_audience_age,
    target_genders,
    required_audience_locations,
    target_cities,
    target_interests,
    creator_types,
    creator_sizes,
    creator_count,
    min_subs_followers,
    min_engagement_rate,
    num_videos,
    video_includes,
    num_youtube_shorts,
    num_streams,
    num_twitch_clips,
    min_stream_duration,
    num_posts,
    num_short_videos,
    content_guidelines,
    must_include_link,
    must_include_promo_code,
    must_tag_brand,
    landing_page_url,
    tracking_type,
    conversion_goal,
    updated_at: new Date(),
  }

  const existingDraftId = (formData.get('draft_id') as string | null)?.trim() || null
  let campaignId: string

  if (existingDraftId) {
    const existing = await prisma.campaigns.findFirst({
      where: { id: existingDraftId, sponsor_id: sponsor.id, status: 'draft' },
      select: { id: true },
    })
    if (!existing) return { error: 'Draft not found.' }
    await prisma.campaigns.update({ where: { id: existingDraftId }, data: { ...campaignData, status: 'pending_payment' } })
    campaignId = existingDraftId
  } else {
    const campaign = await prisma.campaigns.create({
      data: {
        ...campaignData,
        campaign_code: generateCampaignCode(),
        sponsor_id: sponsor.id,
        status: 'pending_payment',
        creative_package: [],
      },
    })
    campaignId = campaign.id
  }

  // For direct invite campaigns, create the invited application immediately
  if (is_direct_invite && invited_creator_id) {
    const existing = await prisma.campaign_applications.findUnique({
      where: { campaign_id_creator_id: { campaign_id: campaignId, creator_id: invited_creator_id } },
    })
    if (!existing) {
      await prisma.campaign_applications.create({
        data: {
          campaign_id: campaignId,
          creator_id: invited_creator_id,
          status: 'invited',
          app_audience_locations: [],
          app_media_types: [],
        },
      })

      const invitedCreator = await prisma.content_creators.findUnique({
        where: { id: invited_creator_id },
        select: { clerk_user_id: true },
      })
      if (invitedCreator) {
        await createNotification({
          userId: invitedCreator.clerk_user_id,
          role: 'creator',
          type: NOTIFICATION_TYPES.DIRECT_INVITE,
          title: 'You have a direct invite',
          message: `A sponsor has personally invited you to their campaign "${title}". Check your campaigns to respond.`,
          link: '/creator/campaigns',
        })
      }
    }
  }

  revalidatePath('/sponsor/campaigns')
  revalidatePath('/sponsor')
  revalidateTag(sponsorDashboardCacheTag(sponsor.id))
  return { success: true, id: campaignId }
}
