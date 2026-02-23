'use client'

import * as React from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthLayout from '@/components/AuthLayout'

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [stage, setStage] = React.useState<'register' | 'verify'>('register')
  const [email, setEmail] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      await signUp.create({ emailAddress: email, username, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setStage('verify')
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message
      if (code === 'form_password_pwned') {
        setError('This password has appeared in a data breach. Please choose a different one.')
      } else if (code === 'form_identifier_exists') {
        setError('An account with this email already exists.')
      } else if (code === 'form_password_length_too_short') {
        setError('Password must be at least 8 characters.')
      } else if (code === 'form_param_format_invalid' && message?.includes('username')) {
        setError('Username can only contain letters, numbers, and underscores.')
      } else {
        setError(message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/onboarding')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      const errCode = err?.errors?.[0]?.code
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message
      if (errCode === 'form_code_incorrect') {
        setError('Incorrect code. Please check your email and try again.')
      } else if (errCode === 'verification_expired') {
        setError('Code has expired. Please go back and request a new one.')
      } else {
        setError(message || 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!isLoaded) return
    setError('')
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
    } catch {
      setError('Failed to resend code. Please try again.')
    }
  }

  const ErrorBox = ({ message }: { message: string }) => (
    <div className="nx-error">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6.5" stroke="#ff6b8a"/>
        <path d="M7 4v3M7 9v.5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {message}
    </div>
  )

  const SubmitButton = ({ label, loadingLabel }: { label: string; loadingLabel: string }) => (
    <button className="nx-submit" type="submit" disabled={isLoading || !isLoaded}>
      <span className="nx-submit-inner">
        {isLoading ? (
          <><span className="nx-spinner" /> {loadingLabel}</>
        ) : (
          <>
            {label}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </span>
    </button>
  )

  return (
    <AuthLayout>
      {/* Step indicator */}
      <div className="nx-steps">
        <div className={`nx-step ${stage === 'register' ? 'nx-step--active' : 'nx-step--done'}`}>
          <span className="nx-step-dot" /> Register
        </div>
        <div className="nx-step-line" />
        <div className={`nx-step ${stage === 'verify' ? 'nx-step--active' : 'nx-step--inactive'}`}>
          <span className="nx-step-dot" /> Verify
        </div>
      </div>

      {stage === 'register' ? (
        <>
          <div className="nx-badge">New Player</div>
          <h1 className="nx-title">Create <span>Account</span></h1>
          <p className="nx-subtitle">Join NX8UP to start earning XP, landing deals, and levelling up your brand.</p>

          <div className="nx-divider" />

          <form onSubmit={handleRegister}>
            {error && <ErrorBox message={error} />}

            <div className="nx-field">
              <label className="nx-label" htmlFor="email">Email Address</label>
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
                />
              </div>
            </div>

            <div className="nx-field">
              <label className="nx-label" htmlFor="username">Username</label>
              <div className="nx-input-wrap">
                <input
                  id="username"
                  className="nx-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_gamertag"
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
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
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

            <SubmitButton label="Create Account" loadingLabel="Creating Account..." />
          </form>

          <div className="nx-footer">
            Already have an account?{' '}
            <Link href="/sign-in">Sign in</Link>
          </div>
        </>
      ) : (
        <>
          <div className="nx-badge">Verification</div>
          <h1 className="nx-title">Check Your <span>Email</span></h1>
          <p className="nx-subtitle">Enter the 6-digit code we sent to confirm your account.</p>

          <div className="nx-divider" />

          <div className="nx-info">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#00c8ff" strokeOpacity="0.6"/>
              <path d="M7 6.5v4M7 4.5v.5" stroke="#00c8ff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Code sent to <strong style={{ color: '#c8dff0', marginLeft: 4 }}>{email}</strong>
          </div>

          <form onSubmit={handleVerify}>
            {error && <ErrorBox message={error} />}

            <div className="nx-field">
              <label className="nx-label" htmlFor="code">Verification Code</label>
              <div className="nx-input-wrap">
                <input
                  id="code"
                  className="nx-input nx-input--code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
            </div>

            <SubmitButton label="Verify & Continue" loadingLabel="Verifying..." />
          </form>

          <div className="nx-footer">
            Didn&apos;t receive a code?{' '}
            <button className="nx-text-btn" onClick={handleResendCode}>Resend</button>
            {' · '}
            <button className="nx-text-btn" onClick={() => { setStage('register'); setError('') }}>Go back</button>
          </div>
        </>
      )}
    </AuthLayout>
  )
}