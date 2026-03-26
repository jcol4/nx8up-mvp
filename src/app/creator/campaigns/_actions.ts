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
} as const

export async function getOpenCampaigns(limit = 10) {
  return prisma.campaigns.findMany({
    where: { status: 'active' },
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
    if (!creator) return { campaign, eligible: true, reasons: [] as string[] }
    const { eligible, reasons } = matchCreatorToCampaign(creator, campaign)
    return { campaign, eligible, reasons }
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
    },
  })
  if (!campaign) return { error: 'Campaign not found.' }

  const { eligible, reasons } = matchCreatorToCampaign(creator, campaign)
  if (!eligible) {
    return { error: `You do not meet this campaign's requirements: ${reasons.join('; ')}` }
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