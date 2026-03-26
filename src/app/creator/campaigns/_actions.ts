'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
    select: { id: true },
  })
  if (!creator) return { error: 'Creator profile not found. Please complete your profile first.' }

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