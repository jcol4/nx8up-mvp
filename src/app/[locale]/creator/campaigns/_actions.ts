/**
 * Creator campaigns server actions.
 *
 * - **getCreatorOAuthStatus** — checks whether the creator has at least one
 *   verified platform (Twitch or YouTube) and a completed Stripe Connect
 *   account. Used to gate access to the campaigns page.
 *
 * - **getOpenCampaigns** — simple list of live, non-direct-invite campaigns
 *   (used by other parts of the app; no eligibility filtering).
 *
 * - **getOpenCampaignsWithEligibility** — fetches live campaigns and runs
 *   `matchCreatorToCampaign` against the authenticated creator's profile.
 *   Filters out campaigns with score < 75 or with a legal age restriction
 *   the creator's audience does not satisfy.
 *
 * - **getLaunchedCampaigns** — fetches campaigns in "launched" status and
 *   attaches the creator's own application (if any) for status display.
 *
 * - **getCampaignById** — single-campaign lookup including sponsor name and
 *   application count.
 *
 * - **getMyApplication** — looks up the creator's application for a specific
 *   campaign by the composite unique key `campaign_id + creator_id`.
 *
 * - **applyToCampaign** — validates eligibility, checks for duplicates, creates
 *   the application, and sends a notification to the sponsoring company.
 *   Also enforces legal age restrictions before creating the application.
 *
 * - **getMyInvitations** — returns all "invited" applications for the current
 *   creator where the campaign is still live or launched.
 *
 * - **respondToInvitation** — accept or decline a direct invite. Accepting
 *   sets status to "accepted" and notifies the sponsor.
 *
 * External services: Prisma/PostgreSQL, Clerk (auth).
 *
 * Gotcha: `getOpenCampaignsWithEligibility` also filters inside `.filter()`
 * after the `.map()` (the legal age check at line ~85). This means the initial
 * score filter (score < 75) and the legal check run as separate passes over
 * the same array. Both could be merged into one `.filter()` call.
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { matchCreatorToCampaign } from '@/lib/matching'
import { notify } from '@/lib/notification-events'
import { resolveCreatorMissions } from '@/lib/mission-resolver'

/**
 * Returns whether the creator has a verified platform connection and a
 * complete Stripe Connect account. Used to gate campaign page access.
 */
export async function getCreatorOAuthStatus(): Promise<{ verified: boolean; stripeReady: boolean }> {
  const { userId } = await auth()
  if (!userId) return { verified: false, stripeReady: false }
  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { twitch_id: true, youtube_channel_id: true, stripe_connect_id: true, stripe_onboarding_complete: true },
  })
  if (!creator) return { verified: false, stripeReady: false }
  const verified = creator.twitch_id != null || creator.youtube_channel_id != null
  const stripeReady = creator.stripe_connect_id != null && creator.stripe_onboarding_complete === true
  return { verified, stripeReady }
}

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
  audience_regions: true,
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

/**
 * Fetches live, publicly-available campaigns ordered by newest first.
 * No eligibility filtering — use `getOpenCampaignsWithEligibility` for
 * creator-facing display.
 */
export async function getOpenCampaigns(limit = 10) {
  return prisma.campaigns.findMany({
    where: { status: 'live', is_direct_invite: false },
    orderBy: { created_at: 'desc' },
    take: limit,
    include: {
      sponsor: { select: { company_name: true, clerk_user_id: true } },
      _count: { select: { applications: true } },
    },
  })
}

/**
 * Fetches live campaigns and scores them against the authenticated creator's
 * profile using `matchCreatorToCampaign`. Filters out campaigns where the
 * score is below 75 or the legal age restriction is not met by the creator's
 * declared audience age minimum.
 *
 * When the user is not authenticated, all campaigns are returned with
 * score 100 / eligible = true (fallback for unauthenticated browsing).
 */
export async function getOpenCampaignsWithEligibility(limit = 50) {
  const { userId } = await auth()

  const [campaigns, creator] = await Promise.all([
    prisma.campaigns.findMany({
      where: { status: 'live', is_direct_invite: false },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        sponsor: { select: { company_name: true, clerk_user_id: true } },
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

  return campaigns
    .map((campaign) => {
      if (!creator) return { campaign, eligible: true, score: 100, reasons: [] as string[], notes: [] as string[] }
      const { eligible, score, reasons, notes } = matchCreatorToCampaign(creator, campaign)
      return { campaign, eligible, score, reasons, notes }
    })
    .filter(({ campaign, score }) => {
      if (score < 75) return false
      if (campaign.legal_age_restriction && creator?.audience_age_min != null) {
        const restrictionAge = campaign.legal_age_restriction === '21+' ? 21 : 18
        if (creator.audience_age_min < restrictionAge) return false
      }
      return true
    })
}

/**
 * Fetches all campaigns in "launched" status and annotates each with the
 * authenticated creator's own application (status field only), if one exists.
 * The application is looked up by `creator_id` via a nested include with
 * `take: 1`.
 */
export async function getLaunchedCampaigns(limit = 50) {
  const { userId } = await auth()

  const creator = userId
    ? await prisma.content_creators.findUnique({
        where: { clerk_user_id: userId },
        select: { id: true },
      })
    : null

  const campaigns = await prisma.campaigns.findMany({
    where: { status: 'launched' },
    orderBy: { created_at: 'desc' },
    take: limit,
    include: {
      sponsor: { select: { company_name: true, clerk_user_id: true } },
      _count: { select: { applications: true } },
      ...(creator
        ? {
            applications: {
              where: { creator_id: creator.id },
              select: { status: true },
              take: 1,
            },
          }
        : {}),
    },
  })

  return campaigns.map((c) => ({
    campaign: c,
    myApplication: (c as typeof c & { applications?: { status: string }[] }).applications?.[0] ?? null,
  }))
}

export async function getActiveCampaigns({ all = false }: { all?: boolean } = {}) {
  const { userId } = await auth()
  if (!userId) return []

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!creator) return []

  const apps = await prisma.campaign_applications.findMany({
    where: {
      creator_id: creator.id,
      status: 'accepted',
      ...(all ? {} : { campaign: { status: 'launched' } }),
    },
    orderBy: { submitted_at: 'desc' },
    include: {
      opt_out: { select: { id: true, verdict: true } },
      campaign: {
        select: {
          id: true,
          title: true,
          status: true,
          start_date: true,
          end_date: true,
          budget: true,
          creator_count: true,
          brand_name: true,
          sponsor: { select: { company_name: true, clerk_user_id: true } },
        },
      },
    },
  })

  return apps
}

export async function getCampaignById(id: string) {
  return prisma.campaigns.findUnique({
    where: { id },
    include: {
      sponsor: { select: { company_name: true, clerk_user_id: true } },
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
  mediaTypes?: string[]
}

/**
 * Applies the authenticated creator to a campaign.
 *
 * Validation order:
 *  1. Creator profile must exist.
 *  2. Campaign must exist and be in "live" status.
 *  3. Legal age restriction (if set) must be satisfied by the creator's
 *     declared `audience_age_min`.
 *  4. `matchCreatorToCampaign` must return `eligible = true`.
 *  5. No existing application for this creator + campaign.
 *
 * On success, creates the application with status "pending" and sends a
 * notification to the sponsoring company's Clerk user.
 */
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
      status: true,
      title: true,
      sponsor_id: true,
      platform: true,
      min_subs_followers: true,
      min_avg_viewers: true,
      min_engagement_rate: true,
      min_audience_age: true,
      max_audience_age: true,
      required_audience_locations: true,
      required_audience_regions: true,
      target_genders: true,
      target_interests: true,
      creator_types: true,
      creator_sizes: true,
      game_category: true,
      content_type: true,
      campaign_type: true,
      product_type: true,
      legal_age_restriction: true,
    },
  })
  if (!campaign) return { error: 'Campaign not found.' }
  if (campaign.status === 'pending_payment') return { error: 'This campaign is not yet open for applications.' }
  if (campaign.status === 'launched') return { error: 'This campaign is no longer accepting applications.' }

  if (campaign.legal_age_restriction && creator.audience_age_min != null) {
    const restrictionAge = campaign.legal_age_restriction === '21+' ? 21 : 18
    if (creator.audience_age_min < restrictionAge) {
      return { error: `This campaign requires an audience aged ${campaign.legal_age_restriction} or older. Your audience age minimum does not meet this requirement.` }
    }
  }

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
      app_audience_regions: creator.audience_regions ?? [],
      app_required_regions: campaign.required_audience_regions ?? [],
      app_media_types: data.mediaTypes ?? [],
    },
  })

  // Notify sponsor that a creator applied
  const sponsor = await prisma.sponsors.findUnique({
    where: { id: campaign.sponsor_id },
    select: { clerk_user_id: true },
  })
  if (sponsor) {
    await notify({
      type: 'creator_applied',
      userId: sponsor.clerk_user_id,
      campaignId,
      campaignTitle: campaign.title,
      viaInvite: false,
    })
  }

  revalidatePath('/creator/campaigns')
  revalidatePath(`/creator/campaigns/${campaignId}`)

  resolveCreatorMissions(creator.id).catch(console.error)

  return { success: true }
}

export async function getMyInvitations() {
  const { userId } = await auth()
  if (!userId) return []

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!creator) return []

  const applications = await prisma.campaign_applications.findMany({
    where: {
      creator_id: creator.id,
      status: 'invited',
      campaign: { status: { in: ['live', 'launched'] } },
    },
    include: {
      campaign: {
        include: {
          sponsor: { select: { company_name: true, clerk_user_id: true } },
        },
      },
    },
    orderBy: { submitted_at: 'desc' },
  })

  return applications
}

/**
 * Accepts or declines a direct invite (`application.status === "invited"`).
 * Validates that the application belongs to the authenticated creator and that
 * the campaign is funded (not "pending_payment"). Accepting sends a
 * notification to the sponsor.
 */
export async function respondToInvitation(
  applicationId: string,
  response: 'accept' | 'decline',
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not authenticated' }

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!creator) return { error: 'Creator profile not found.' }

  const application = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          status: true,
          sponsor: { select: { clerk_user_id: true } },
        },
      },
    },
  })
  if (!application || application.creator_id !== creator.id) {
    return { error: 'Invitation not found.' }
  }
  if (application.status !== 'invited') {
    return { error: 'This invitation has already been responded to.' }
  }
  if (application.campaign.status === 'pending_payment') {
    return { error: 'This campaign is not yet funded. You will be able to respond once the sponsor completes payment.' }
  }

  await prisma.campaign_applications.update({
    where: { id: applicationId },
    data: { status: response === 'accept' ? 'accepted' : 'rejected' },
  })

  if (response === 'accept') {
    await notify({
      type: 'creator_applied',
      userId: application.campaign.sponsor.clerk_user_id,
      campaignId: application.campaign.id,
      campaignTitle: application.campaign.title,
      viaInvite: true,
    })
  }

  revalidatePath('/creator/campaigns')
  revalidatePath(`/creator/campaigns/${application.campaign_id}`)
  return { success: true }
}

export async function requestOptOut(applicationId: string, reason: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' }

  if (!reason.trim()) return { error: 'Reason is required.' }

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!creator) return { error: 'Creator not found.' }

  const application = await prisma.campaign_applications.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      creator_id: true,
      status: true,
      opt_out: { select: { id: true } },
      campaign: { select: { id: true, title: true, start_date: true } },
      creator: { select: { id: true, clerk_user_id: true } },
    },
  })

  if (!application || application.creator.clerk_user_id !== userId) {
    return { error: 'Application not found.' }
  }

  if (application.opt_out) {
    return { error: 'An opt-out request already exists for this campaign.' }
  }

  const now = new Date()
  if (application.campaign.start_date && application.campaign.start_date <= now) {
    return { error: 'Cannot opt out after the campaign has already started.' }
  }

  await prisma.creator_opt_outs.create({
    data: {
      application_id: applicationId,
      creator_id: creator.id,
      reason: reason.trim(),
      verdict: 'pending',
    },
  })

  await prisma.campaign_applications.update({
    where: { id: applicationId },
    data: { status: 'opted_out' },
  })

  revalidatePath('/creator/campaigns')
  return { success: true }
}