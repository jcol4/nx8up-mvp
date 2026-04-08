'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyProofUrl, fetchPostTimestamp } from '@/lib/verify-proof-url'

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
    .slice(0, 8)
}

async function getCreator(userId: string) {
  return prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, twitch_id: true, youtube_channel_id: true },
  })
}

export async function getMyDealRooms() {
  const { userId } = await auth()
  if (!userId) return []

  const creator = await getCreator(userId)
  if (!creator) return []

  return prisma.campaign_applications.findMany({
    where: { creator_id: creator.id, status: 'accepted', campaign: { status: 'launched' } },
    orderBy: { submitted_at: 'desc' },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          brand_name: true,
          status: true,
          end_date: true,
          budget: true,
          creator_count: true,
        },
      },
      deal_submission: {
        select: { status: true, submitted_at: true },
      },
    },
  })
}

export async function getDealRoom(applicationId: string) {
  const { userId } = await auth()
  if (!userId) return null

  const creator = await getCreator(userId)
  if (!creator) return null

  let app = await prisma.campaign_applications.findUnique({
    where: { id: applicationId, creator_id: creator.id, status: 'accepted', campaign: { status: 'launched' } },
    include: {
      campaign: {
        include: { sponsor: { select: { company_name: true } } },
      },
      deal_submission: true,
    },
  })

  // Lazily generate a short code for applications that were accepted before
  // the link-tracking feature was added (or any accepted app missing one).
  if (app && !app.tracking_short_code && app.campaign.landing_page_url) {
    let code = generateShortCode()
    while (await prisma.campaign_applications.findUnique({ where: { tracking_short_code: code } })) {
      code = generateShortCode()
    }
    app = await prisma.campaign_applications.update({
      where: { id: applicationId },
      data: { tracking_short_code: code },
      include: {
        campaign: {
          include: { sponsor: { select: { company_name: true } } },
        },
        deal_submission: true,
      },
    })
  }

  return app
}

export async function getPostTimestamp(url: string): Promise<{ iso: string } | null> {
  const ts = await fetchPostTimestamp(url)
  return ts ? { iso: ts } : null
}

export type ProofData = {
  proof_urls: string[]
  screenshot_url: string
  posted_at: string
  disclosure_confirmed: boolean
}

export async function submitProof(
  applicationId: string,
  data: ProofData,
): Promise<{ error?: string; warning?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const creator = await getCreator(userId)
  if (!creator) return { error: 'Creator profile not found.' }

  const application = await prisma.campaign_applications.findUnique({
    where: { id: applicationId, creator_id: creator.id, status: 'accepted' },
  })
  if (!application) return { error: 'Deal room not found.' }

  const urls = data.proof_urls.map((u) => u.trim()).filter(Boolean)
  if (urls.length === 0) return { error: 'At least one post URL is required.' }
  if (new Set(urls).size !== urls.length) return { error: 'Duplicate URLs are not allowed. Each video must be unique.' }
  if (!data.posted_at) return { error: 'Post timestamp is required.' }
  if (!data.disclosure_confirmed) return { error: 'You must confirm the disclosure.' }

  // Verify every URL belongs to this creator's account
  const creatorIds = { twitch_id: creator.twitch_id, youtube_channel_id: creator.youtube_channel_id }
  const warnings: string[] = []
  for (const url of urls) {
    const result = await verifyProofUrl(url, creatorIds)
    if (result.status === 'failed') return { error: `${url}: ${result.error}` }
    if (result.status === 'unverifiable') warnings.push(result.reason)
  }

  const warning = warnings.length > 0 ? warnings[0] : undefined

  await prisma.deal_submissions.upsert({
    where: { application_id: applicationId },
    create: {
      application_id: applicationId,
      proof_urls: urls,
      screenshot_url: data.screenshot_url.trim() || null,
      posted_at: new Date(data.posted_at),
      disclosure_confirmed: true,
      submitted_at: new Date(),
      status: 'submitted',
    },
    update: {
      proof_urls: urls,
      screenshot_url: data.screenshot_url.trim() || null,
      posted_at: new Date(data.posted_at),
      disclosure_confirmed: true,
      submitted_at: new Date(),
      status: 'submitted',
    },
  })

  revalidatePath(`/creator/deal-room/${applicationId}`)
  revalidatePath('/creator/deal-room')

  return { success: true, warning }
}
