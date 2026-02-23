// adds middleware capabilities from clerk
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { create } from "domain";
import { NextRequest, NextResponse } from 'next/server'

const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isPublicRoute = createRouteMatcher(['/public-route-example'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const { isAuthenticated, sessionClaims, redirectToSignIn } = await auth()

    //do not redirect users who are visiting/onboarding
    if (isAuthenticated && isOnboardingRoute(req)) {
        return NextResponse.next()
    }

    //if user is not signed in and route is private, redirect to signin
    if (!isAuthenticated && !isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })

    //if user has not completed onboarding in their public metadata, redirect them to onboarding route
    if (isAuthenticated && !sessionClaims?.metadata?.onboardingComplete) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
    }

    //if user is signed in and route is protected, allow them to view
    if (isAuthenticated && !isPublicRoute(req)) return NextResponse.next()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',    
    ]
}