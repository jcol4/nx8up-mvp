/**
 * GET /api/stripe/connect/return
 *
 * Stripe redirects the creator here after they complete (or exit) the Express
 * onboarding flow. Checks whether charges_enabled is now true on the Connect
 * account and updates stripe_onboarding_complete accordingly.
 *
 * This is also used as the `refresh_url` in account links — if the link expires
 * Stripe redirects here and the creator is sent back to their profile page.
 *
 * Redirects to: /creator/profile (always, regardless of onboarding outcome)
 */
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

/** Handles the return redirect from Stripe Express onboarding. */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, stripe_connect_id: true },
  })

  if (!creator?.stripe_connect_id) {
    return NextResponse.redirect(new URL('/creator/profile', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const account = await stripe.accounts.retrieve(creator.stripe_connect_id)

  if (account.charges_enabled) {
    await prisma.content_creators.update({
      where: { id: creator.id },
      data: { stripe_onboarding_complete: true },
    })
  }

  return NextResponse.redirect(new URL('/creator/profile', process.env.NEXT_PUBLIC_APP_URL!))
}
