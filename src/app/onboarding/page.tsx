'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import AuthLayout from '@/components/AuthLayout'

export default function OnboardingComponent() {
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const { user } = useUser()
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError('')
    const res = await completeOnboarding(formData)
    if (res?.message) {
      await user?.reload()
      router.push('/')
    }
    if (res?.error) {
      setError(res?.error)
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="nx-badge">Age Verification</div>
      <h1 className="nx-title">Access <span>Protocol</span></h1>
      <p className="nx-subtitle">
        NX8UP is restricted to users 18 and older. Confirm your date of birth to unlock your account and begin your missions.
      </p>

      <div className="nx-divider" />

      <form action={handleSubmit}>
        <div className="nx-field">
          <label className="nx-label" htmlFor="userDateOfBirth">Date of Birth</label>
          <div className="nx-input-wrap">
            <input
              id="userDateOfBirth"
              className="nx-input"
              type="date"
              name="userDateOfBirth"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <p className="nx-hint">Must be 18 or older to access platform</p>
        </div>

        {error && (
          <div className="nx-error">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="#ff6b8a"/>
              <path d="M7 4v3M7 9v.5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className="nx-xp-bar">
          <div className="nx-xp-label">
            <span>Onboarding Progress</span>
            <strong>Step 1 / 1</strong>
          </div>
          <div className="nx-xp-track">
            <div className="nx-xp-fill" style={{ width: '50%' }} />
          </div>
        </div>

        <button className="nx-submit" type="submit" disabled={isLoading}>
          <span className="nx-submit-inner">
            {isLoading ? (
              <><span className="nx-spinner" /> Verifying...</>
            ) : (
              <>
                Confirm &amp; Enter
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </span>
        </button>
      </form>

      <p className="nx-footer">Date of birth used for verification only</p>
    </AuthLayout>
  )
}