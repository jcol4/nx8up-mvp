/**
 * @file forgot-password/[[...forgot-password]]/page.tsx
 *
 * Custom Clerk password-reset page for the nx8up platform. Uses the low-level
 * Clerk `useSignIn` hook with the `reset_password_email_code` strategy to
 * provide a fully custom UI consistent with the platform's design system.
 *
 * Two-stage flow controlled by the `stage` state:
 *   1. `"request"` – collects the user's email and calls
 *      `signIn.create({ strategy: 'reset_password_email_code', identifier })`
 *      to dispatch a 6-digit reset code to the user's email.
 *   2. `"reset"` – accepts the code plus a new password (with confirmation)
 *      and submits via `signIn.attemptFirstFactor`. On success the temporary
 *      Clerk session created by the reset is signed out via `clerk.signOut`
 *      and the user is redirected to /sign-in to authenticate fresh with
 *      the new password.
 *
 * Additional behaviors:
 *   - "Resend code" re-issues `signIn.create` without resetting any other
 *     state, so the email and entered code field are preserved.
 *   - Clerk error codes are mapped to specific, actionable user messages
 *     (unknown email, weak password, expired/incorrect code, etc.).
 *   - For privacy on the request stage, an `form_identifier_not_found` error
 *     is *not* surfaced to the user. The UI advances to the reset stage
 *     regardless of whether the email exists, so an attacker cannot use the
 *     form to enumerate registered emails.
 *
 * External services:
 *   - Clerk (`useSignIn`, `useClerk.signOut`) – password reset and explicit
 *     session teardown so the user lands on /sign-in fully signed out.
 *
 * Gotchas:
 *   - The `useClerk().signOut()` call is required after a successful reset.
 *     Even though we never call `setActive`, Clerk sets a session cookie as
 *     part of the reset flow and `proxy.ts` middleware will treat the user
 *     as already signed in on /sign-in (redirecting them away) without an
 *     explicit signOut.
 *   - There is no rate-limiting or cooldown on "Resend code"; a user could
 *     spam the Clerk API by clicking the button repeatedly. Clerk applies
 *     its own server-side rate limits but no client-side feedback is shown.
 */
'use client'

import * as React from 'react'
import { useSignIn, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/layout'

export default function ForgotPasswordPage() {
  const { isLoaded, signIn } = useSignIn()
  const { signOut } = useClerk()
  const [stage, setStage] = React.useState<'request' | 'reset'>('request')
  const [email, setEmail] = React.useState('')
  const [code, setCode] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const router = useRouter()

  /**
   * Handles the email request form submission (stage: "request").
   *
   * Calls `signIn.create` with the `reset_password_email_code` strategy,
   * which causes Clerk to email a 6-digit code to the address if it
   * matches a registered user. To prevent email enumeration, the UI
   * advances to the reset stage regardless of whether the email exists —
   * `form_identifier_not_found` errors are silently swallowed.
   */
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      })
      setStage('reset')
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message
      if (errCode === 'form_identifier_not_found') {
        // Privacy: do not reveal whether the email is registered. Advance
        // to the reset stage as if a code had been sent.
        setStage('reset')
      } else if (errCode === 'form_param_format_invalid') {
        setError('Please enter a valid email address.')
      } else {
        setError(message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the reset form submission (stage: "reset").
   *
   * Validates the password confirmation locally, then calls
   * `signIn.attemptFirstFactor` with the email code and new password. On
   * a `complete` status the temporary session created by Clerk during
   * the reset is signed out (clearing the session cookie) and the user
   * is redirected to /sign-in to authenticate with the new credentials.
   */
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        // Clerk creates a session as part of a successful reset and sets
        // its cookie even though we never called setActive. Explicitly
        // sign it out so the /sign-in page sees the user as logged out.
        await signOut({ redirectUrl: '/sign-in' })
      } else {
        setError('Reset incomplete. Please try again.')
      }
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message
      if (errCode === 'form_code_incorrect') {
        setError('Incorrect code. Please check your email and try again.')
      } else if (errCode === 'verification_expired') {
        setError('This code has expired. Please request a new one.')
      } else if (errCode === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different one.')
      } else if (errCode === 'form_password_length_too_short') {
        setError('Password is too short. Please use at least 8 characters.')
      } else if (errCode) {
        setError(message || 'Something went wrong. Please try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Re-issues the reset code by calling `signIn.create` again with the
   * same email. Does not reset other UI state.
   */
  const handleResend = async () => {
    if (!isLoaded) return
    setError('')
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      })
    } catch (err: any) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message
      setError(message || 'Could not resend code. Please try again.')
    }
  }

  // ── Reset screen ───────────────────────────────────────────────────────────
  if (stage === 'reset') {
    return (
      <AuthLayout>
        <div className="nx-badge">Reset Password</div>
        <h1 className="nx-title">Check your <span>Email</span></h1>
        <p className="nx-subtitle">
          We sent a reset code to your email. Enter it below along with your new password.
        </p>

        <div className="nx-divider" />

        <form onSubmit={handleResetSubmit}>
          {error && (
            <div className="nx-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6.5" stroke="#ff6b8a"/>
                <path d="M7 4v3M7 9v.5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className="nx-field">
            <label className="nx-label" htmlFor="code">Reset Code</label>
            <div className="nx-input-wrap">
              <input
                id="code"
                className="nx-input nx-input--code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor="password">New Password</label>
            <div className="nx-input-wrap">
              <input
                id="password"
                className="nx-input nx-input--password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                className="nx-show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor="confirmPassword">Confirm New Password</label>
            <div className="nx-input-wrap">
              <input
                id="confirmPassword"
                className="nx-input nx-input--password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          <button className="nx-submit" type="submit" disabled={isLoading || !isLoaded || code.length < 6}>
            <span className="nx-submit-inner">
              {isLoading ? (
                <><span className="nx-spinner" /> Resetting...</>
              ) : (
                <>
                  Reset Password
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </span>
          </button>
        </form>

        <div className="nx-footer">
          <button
            type="button"
            className="nx-text-btn"
            onClick={handleResend}
          >
            Resend code
          </button>
          {' · '}
          <button
            type="button"
            className="nx-text-btn"
            onClick={() => {
              setStage('request')
              setCode('')
              setPassword('')
              setConfirmPassword('')
              setError('')
            }}
          >
            Use a different email
          </button>
        </div>
      </AuthLayout>
    )
  }

  // ── Request screen ─────────────────────────────────────────────────────────
  return (
    <AuthLayout>
      <div className="nx-badge">Reset Password</div>
      <h1 className="nx-title">Forgot your <span>Password?</span></h1>
      <p className="nx-subtitle">
        Enter your email and we'll send you a code to reset your password.
      </p>

      <div className="nx-divider" />

      <form onSubmit={handleRequestSubmit}>
        {error && (
          <div className="nx-error">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#ff6b8a"/>
              <path d="M7 4v3M7 9v.5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className="nx-field">
          <label className="nx-label" htmlFor="email">Email</label>
          <div className="nx-input-wrap">
            <input
              id="email"
              className="nx-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        <button className="nx-submit" type="submit" disabled={isLoading || !isLoaded}>
          <span className="nx-submit-inner">
            {isLoading ? (
              <><span className="nx-spinner" /> Sending...</>
            ) : (
              <>
                Send Reset Code
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </span>
        </button>
      </form>

      <div className="nx-footer">
        Remembered it?{' '}
        <Link href="/sign-in">Back to sign in</Link>
      </div>
    </AuthLayout>
  )
}
