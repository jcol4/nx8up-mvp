'use client'

import * as React from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({ identifier, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/')
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message
      if (code === 'form_password_incorrect') {
        setError('Incorrect password. Please try again.')
      } else if (code === 'form_identifier_not_found') {
        setError('No account found with that email or username.')
      } else {
        setError(message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="nx-badge">Player Login</div>
      <h1 className="nx-title">Welcome <span>Back</span></h1>
      <p className="nx-subtitle">Sign in to access your missions, deals, and dashboard.</p>

      <div className="nx-divider" />

      <form onSubmit={handleSubmit}>
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
          <label className="nx-label" htmlFor="identifier">Email or Username</label>
          <div className="nx-input-wrap">
            <input
              id="identifier"
              className="nx-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or username"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="nx-field">
          <label className="nx-label" htmlFor="password">Password</label>
          <div className="nx-input-wrap">
            <input
              id="password"
              className="nx-input nx-input--password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
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

        <button className="nx-submit" type="submit" disabled={isLoading || !isLoaded}>
          <span className="nx-submit-inner">
            {isLoading ? (
              <><span className="nx-spinner" /> Authenticating...</>
            ) : (
              <>
                Enter Platform
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </span>
        </button>
      </form>

      <div className="nx-footer">
        No account yet?{' '}
        <Link href="/sign-up">Create one</Link>
      </div>
    </AuthLayout>
  )
}