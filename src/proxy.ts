import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createI18nMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'

const handleI18n = createI18nMiddleware(routing)

// Match locale-prefixed protected routes
const isAdminRoute = createRouteMatcher(['/:locale/admin(.*)'])
const isCreatorRoute = createRouteMatcher(['/:locale/creator(.*)'])
const isSponsorRoute = createRouteMatcher(['/:locale/sponsor(.*)'])
const isOnboardingRoute = createRouteMatcher(['/:locale/onboarding'])

// Public marketing landing page: the locale root (and bare root) render for
// signed-out visitors instead of bouncing them to sign-in.
const isLandingRoute = createRouteMatcher(['/', '/:locale'])

// Auth routes stay flat (outside [locale])
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/forgot-password(.*)',
])

function getLocaleFromReq(req: Parameters<typeof handleI18n>[0]) {
  return req.cookies.get('NEXT_LOCALE')?.value ?? routing.defaultLocale
}

export default clerkMiddleware(async (auth, req) => {
  // Static API routes bypass both auth and i18n
  if (req.nextUrl.pathname.startsWith('/api/auth/')) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith('/api/stripe/webhook')) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  // Referral short-links bypass i18n
  if (req.nextUrl.pathname.startsWith('/r/')) return NextResponse.next()

  // Public auth routes: redirect signed-in users to their dashboard
  if (isPublicRoute(req)) {
    const { userId, sessionClaims } = await auth()
    if (userId) {
      const locale = getLocaleFromReq(req)
      const role = (sessionClaims?.metadata as { role?: string })?.role
      if (role === 'admin') return NextResponse.redirect(new URL(`/${locale}/admin`, req.url))
      if (role === 'creator') return NextResponse.redirect(new URL(`/${locale}/creator`, req.url))
      if (role === 'sponsor') return NextResponse.redirect(new URL(`/${locale}/sponsor`, req.url))
      return NextResponse.redirect(new URL(`/${locale}`, req.url))
    }
    return NextResponse.next()
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  const locale = getLocaleFromReq(req)

  // Not signed in → sign-in (flat route, no locale prefix needed),
  // except the public landing page, which renders for signed-out visitors.
  if (!userId) {
    if (isLandingRoute(req)) return handleI18n(req)
    return redirectToSignIn()
  }

  // Signed in but not onboarded → onboarding
  if (!(sessionClaims?.metadata as { onboardingComplete?: boolean })?.onboardingComplete) {
    if (isOnboardingRoute(req)) return handleI18n(req)
    return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url))
  }

  // Role-based route guards
  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}`, req.url))
  }

  if (isCreatorRoute(req) && role !== 'creator' && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}`, req.url))
  }

  if (isSponsorRoute(req) && role !== 'sponsor' && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}`, req.url))
  }

  // All other routes: run i18n locale detection and routing
  return handleI18n(req)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
