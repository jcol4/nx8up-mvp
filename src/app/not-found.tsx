/**
 * @file not-found.tsx
 * @description Custom 404 page rendered by Next.js App Router for any unmatched route.
 *
 * Responsibilities:
 * - Renders a branded 404 screen consistent with the nx8up dark design system.
 * - Provides two navigation escapes: "Go home" (hard link to /) and "Go back"
 *   (calls router.back() to return to the previous history entry).
 *
 * This is a Client Component ('use client') because it uses useRouter for the
 * browser history back action.
 *
 * Gotchas:
 * - router.back() is a no-op if the user landed directly on the 404 URL with no
 *   previous history entry (e.g. opened from a bookmark or external link).
 *   Consider disabling or hiding the button in that case.
 */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Renders the 404 not-found UI.
 * No props — Next.js calls this automatically when notFound() is thrown or a
 * route segment cannot be matched.
 */
export default function NotFound() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ background: '#0a1223' }}
    >
      {/* Glow backdrop */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* 404 */}
        <div className="relative select-none">
          <p
            className="font-bold leading-none"
            style={{
              fontSize: 'clamp(7rem, 20vw, 14rem)',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(0,200,255,0.2)',
              letterSpacing: '-0.04em',
            }}
          >
            404
          </p>
          <p
            className="absolute inset-0 flex items-center justify-center font-bold leading-none"
            style={{
              fontSize: 'clamp(7rem, 20vw, 14rem)',
              background: 'linear-gradient(135deg, #00c8ff 0%, rgba(0,200,255,0.3) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.04em',
              opacity: 0.18,
            }}
          >
            404
          </p>
        </div>

        {/* Message */}
        <div className="space-y-2 -mt-4">
          <h1
            className="text-xl sm:text-2xl font-semibold"
            style={{ color: '#e8f4ff' }}
          >
            Page not found
          </h1>
          <p className="text-sm max-w-sm" style={{ color: '#4a6080' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 h-px" style={{ background: 'rgba(0,200,255,0.2)' }} />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="py-2.5 px-6 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#00c8ff', color: '#0a1223' }}
          >
            Go home
          </Link>
          <button
            onClick={() => router.back()}
            className="py-2.5 px-6 rounded-lg text-sm font-medium transition-colors"
            style={{ border: '1px solid rgba(0,200,255,0.2)', color: '#4a6080' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8dff0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a6080')}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
