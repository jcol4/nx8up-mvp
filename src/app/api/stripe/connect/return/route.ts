import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

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
