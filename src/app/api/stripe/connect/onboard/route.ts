/**
 * POST /api/stripe/connect/onboard
 *
 * Creates (or retrieves) a Stripe Express Connect account for the creator and
 * returns a one-time account link URL to redirect the creator into Stripe's
 * hosted onboarding flow.
 *
 * - If the creator already has a stripe_connect_id, re-uses that account.
 * - Pre-fills the Stripe profile with the creator's Twitch/YouTube URL and handle
 *   so they don't see confusing "business website" prompts.
 * - Payout schedule is set to manual so creators control their own timing.
 *
 * Returns: { url: string } — the Stripe-hosted onboarding URL to redirect to.
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

/** Creates or resumes a Stripe Express onboarding session for the authenticated creator. */
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: {
      id: true,
      email: true,
      stripe_connect_id: true,
      twitch_username: true,
      youtube_handle: true,
      youtube_channel_id: true,
    },
  })

  if (!creator) {
    return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
  }

  // Re-use existing Connect account if one was created already
  let accountId = creator.stripe_connect_id

  if (!accountId) {
    // Build a social profile URL to pre-fill the "website" field so creators
    // don't need to enter a business website — their Twitch or YouTube page counts.
    const profileUrl =
      creator.twitch_username
        ? `https://www.twitch.tv/${creator.twitch_username}`
        : creator.youtube_handle
          ? `https://www.youtube.com/${creator.youtube_handle}`
          : creator.youtube_channel_id
            ? `https://www.youtube.com/channel/${creator.youtube_channel_id}`
            : null

    // Use the creator's handle as their display name instead of a business name
    const displayName =
      creator.twitch_username ??
      creator.youtube_handle?.replace(/^@/, '') ??
      null

    const account = await stripe.accounts.create({
      type: 'express',
      email: creator.email,
      // Mark as individual so Stripe skips all company/business questions
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
      },
      // Pre-fill profile fields so creators don't hit confusing prompts
      business_profile: {
        ...(profileUrl ? { url: profileUrl } : {}),
        ...(displayName ? { name: displayName } : {}),
      },
      settings: {
        payouts: {
          // Allow creators to set their own payout schedule after onboarding
          schedule: { interval: 'manual' },
        },
      },
    })

    accountId = account.id

    await prisma.content_creators.update({
      where: { id: creator.id },
      data: { stripe_connect_id: accountId },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/stripe/connect/onboard`,
    return_url: `${appUrl}/api/stripe/connect/return`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
