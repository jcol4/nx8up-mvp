/**
 * Deal room server actions.
 *
 * - **getMyDealRooms** — returns all accepted campaign applications where the
 *   campaign is in "launched" status, including submission status for the
 *   deal room listing page.
 *
 * - **getDealRoom** — returns a single accepted application with full campaign
 *   and submission details. Lazily generates a unique 8-character tracking
 *   short code (`tracking_short_code`) if the application lacks one and the
 *   campaign has a `landing_page_url`. Short codes are collision-resistant via
 *   a while-loop uniqueness check.
 *
 * - **getPostTimestamp** — wraps `fetchPostTimestamp` from `@/lib/verify-proof-url`
 *   to return the publish time of a content URL. Called client-side on blur
 *   to auto-fill the "posted at" field in the proof form.
 *
 * - **submitProof** — validates and upserts a `deal_submissions` row.
 *   Validation includes:
 *    - At least one URL required.
 *    - No duplicate URLs.
 *    - `posted_at` timestamp required.
 *    - Disclosure confirmed.
 *    - Each URL verified against the creator's Twitch/YouTube account via
 *      `verifyProofUrl`. "failed" → hard error; "unverifiable" → soft warning.
 *
 * External services: Prisma/PostgreSQL, `@/lib/verify-proof-url` (URL
 * verification against Twitch/YouTube APIs).
 *
 * Gotcha: `generateShortCode` uses `randomBytes(8)` mapped through a 36-char
 * alphabet but slices the result to 8 characters. The collision loop is
 * unbounded in theory, though collision probability is negligible.
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { verifyProofUrl, fetchPostTimestamp } from '@/lib/verify-proof-url'

/**
 * Generates a random 8-character alphanumeric short code for tracking links.
 * Uses `randomBytes` from Node's `crypto` module for entropy.
 */
function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
    .slice(0, 8)
}

/**
 * Internal helper: looks up the `content_creators` row for the given Clerk
 * `userId`, returning only the fields needed by deal room actions.
 */
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
          platform: true,
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

/** Payload submitted by the creator via `ProofSubmitForm`. */
export type ProofData = {
  proof_urls: string[]
  /** Optional URL to a screenshot image showing sponsor branding in content. */
  screenshot_url: string
  /** ISO datetime string of when the content was published. */
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
