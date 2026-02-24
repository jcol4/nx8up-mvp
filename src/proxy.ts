// adds middleware capabilities from clerk
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isCreatorRoute = createRouteMatcher(['/dashboard(.*)'])
const isOnboardingRoute = createRouteMatcher(['/onboarding'])

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth()
    const role = (sessionClaims?.metadata as any)?.role as string | undefined

    //allow anyone to see signin/signup pages
    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    //not signed in - direct to signin
    if (!userId) {
        return redirectToSignIn({ returnBackUrl: req.url })
    }

    //signed in but not onboarded, redirect to onboarding
    if (!(sessionClaims?.metadata as any)?.onboardingComplete) {
        if (isOnboardingRoute(req)) return NextResponse.next()
        return NextResponse.redirect( new URL('/onboarding', req.url))
    }

    //admin only routes
    if (isAdminRoute(req) && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
    }

    if (isCreatorRoute(req) && role !== 'creator' && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))    
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',    
    ]
}