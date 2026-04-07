import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, email: true, stripe_connect_id: true },
  })

  if (!creator) {
    return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
  }

  // Re-use existing Connect account if one was created already
  let accountId = creator.stripe_connect_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: creator.email,
      capabilities: {
        transfers: { requested: true },
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
