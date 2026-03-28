'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { matchCreatorToCampaign } from '@/lib/matching'

const CREATOR_MATCHING_SELECT = {
  platform: true,
  subs_followers: true,
  youtube_subscribers: true,
  average_vod_views: true,
  youtube_avg_views: true,
  engagement_rate: true,
  audience_age_min: true,
  audience_age_max: true,
  audience_locations: true,
  audience_gender: true,
  audience_interests: true,
  creator_types: true,
  creator_size: true,
  game_category: true,
  content_type: true,
  preferred_campaign_types: true,
  preferred_product_types: true,
  is_available: true,
} as const

export async function getOpenCampaigns(limit = 10) {
  return prisma.campaigns.findMany({
    where: { status: 'live' },
    orderBy: { created_at: 'desc' },
    take: limit,
    include: {
      sponsor: { select: { company_name: true } },
      _count: { select: { applications: true } },
    },
  })
}

export async function getOpenCampaignsWithEligibility(limit = 50) {
  const { userId } = await auth()

  const [campaigns, creator] = await Promise.all([
    prisma.campaigns.findMany({
      where: { status: 'active' },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        sponsor: { select: { company_name: true } },
        _count: { select: { applications: true } },
      },
    }),
    userId
      ? prisma.content_creators.findUnique({
          where: { clerk_user_id: userId },
          select: CREATOR_MATCHING_SELECT,
        })
      : null,
  ])

  return campaigns.map((campaign) => {
    if (!creator) return { campaign, eligible: true, score: 100, reasons: [] as string[], notes: [] as string[] }
    const { eligible, score, reasons, notes } = matchCreatorToCampaign(creator, campaign)
    return { campaign, eligible, score, reasons, notes }
  })
}

export async function getCampaignById(id: string) {
  return prisma.campaigns.findUnique({
    where: { id },
    include: {
      sponsor: { select: { company_name: true } },
      _count: { select: { applications: true } },
    },
  })
}

export async function getMyApplication(campaignId: string) {
  const { userId } = await auth()
  if (!userId) return null

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!creator) return null

  return prisma.campaign_applications.findUnique({
    where: { campaign_id_creator_id: { campaign_id: campaignId, creator_id: creator.id } },
  })
}

export type ApplicationData = {
  message: string
  audienceAgeMin?: number | null
  audienceAgeMax?: number | null
  audienceLocations?: string[]
  location?: string
}

export async function applyToCampaign(
  campaignId: string,
  data: ApplicationData
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, ...CREATOR_MATCHING_SELECT },
  })
  if (!creator) return { error: 'Creator profile not found. Please complete your profile first.' }

  const campaign = await prisma.campaigns.findUnique({
    where: { id: campaignId },
    select: {
      platform: true,
      min_subs_followers: true,
      min_avg_viewers: true,
      min_engagement_rate: true,
      min_audience_age: true,
      max_audience_age: true,
      required_audience_locations: true,
      target_genders: true,
      target_interests: true,
      creator_types: true,
      creator_sizes: true,
      game_category: true,
      content_type: true,
      campaign_type: true,
      product_type: true,
    },
  })
  if (!campaign) return { error: 'Campaign not found.' }

  const { eligible, reasons } = matchCreatorToCampaign(creator, campaign)
  if (!eligible) {
    return { error: `Requirements not met: ${reasons.join('; ')}` }
  }

  const existing = await prisma.campaign_applications.findUnique({
    where: { campaign_id_creator_id: { campaign_id: campaignId, creator_id: creator.id } },
  })
  if (existing) return { error: 'You have already applied to this campaign.' }

  await prisma.campaign_applications.create({
    data: {
      campaign_id: campaignId,
      creator_id: creator.id,
      message: data.message.trim() || null,
      status: 'pending',
      app_audience_age_min: data.audienceAgeMin ?? null,
      app_audience_age_max: data.audienceAgeMax ?? null,
      app_audience_locations: data.audienceLocations ?? [],
      app_location: data.location?.trim() || null,
    },
  })

  revalidatePath('/creator/campaigns')
  revalidatePath(`/creator/campaigns/${campaignId}`)
  return { success: true }
}