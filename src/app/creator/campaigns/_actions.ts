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

export async function applyToCampaign(
  campaignId: string,
  message: string
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
      message: message.trim() || null,
      status: 'pending',
    },
  })

  revalidatePath('/creator/campaigns')
  revalidatePath(`/creator/campaigns/${campaignId}`)
  return { success: true }
}