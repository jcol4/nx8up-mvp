/**
 * @file onboarding/page.tsx
 *
 * Client-side onboarding: date of birth (18+) and role (creator | sponsor).
 */
'use client'

import * as React from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { AuthLayout } from '@/components/layout'
import { BirthdateSelect } from '@/components/ui'

export default function OnboardingComponent() {
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const maxDob = React.useMemo(() => new Date().toISOString().split('T')[0], [])
  const minDob = React.useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 120)
    return d.toISOString().split('T')[0]
  }, [])
  const handleSubmit = async (formData: FormData) => {
    setError('')
    const dob = formData.get('userDateOfBirth') as string | null
    const role = formData.get('role') as string | null
    if (!dob?.trim()) {
      setError('Select your date of birth.')
      return
    }
    if (!role) {
      setError('Choose Creator or Sponsor.')
      return
    }

    setIsLoading(true)
    const res = await completeOnboarding(formData)
    if (res?.message) {
      await user?.reload()
      const roleFromRes = (res.message as { role?: string })?.role
      if (roleFromRes === 'creator') router.push('/creator')
      else if (roleFromRes === 'sponsor') router.push('/sponsor')
      else router.push('/')
    }
    if (res?.error) {
      setError(res?.error)
      setIsLoading(false)
    }
  }

  const roleCardClass =
    'flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.12] bg-[rgb(0_0_0_/0.22)] px-3 py-3 transition-colors hover:border-[#99f7ff]/30 has-[:checked]:border-[#99f7ff]/50 has-[:checked]:bg-[#99f7ff]/[0.07]'

  return (
    <AuthLayout>
      <h1 className="nx-title">
        Account <span>setup</span>
      </h1>
      <p className="nx-subtitle">
        Confirm your age and choose your account type to continue.
      </p>

      <div className="nx-divider" />

      <form noValidate action={handleSubmit}>
        <div className="nx-field">
          <span className="nx-label">Date of birth</span>
          <BirthdateSelect name="userDateOfBirth" max={maxDob} min={minDob} />
          <p className="mt-2 text-center text-[12px] leading-relaxed text-[#a9abb5]">
            You must be 18 or older to use nx8up.
          </p>
        </div>

        <div className="nx-field">
          <span className="nx-label">How will you use nx8up?</span>
          <div className="flex flex-col gap-2">
            <label className={roleCardClass}>
              <input
                type="radio"
                name="role"
                value="creator"
                className="mt-1 accent-[#99f7ff]"
                aria-required="true"
              />
              <span>
                <span className="font-semibold text-[#e8f4ff]">Creator</span>
                <span className="mt-0.5 block text-[13px] font-normal leading-snug text-[#a9abb5]">
                  Work with sponsors on campaigns and deals.
                </span>
              </span>
            </label>
            <label className={roleCardClass}>
              <input
                type="radio"
                name="role"
                value="sponsor"
                className="mt-1 accent-[#99f7ff]"
                aria-required="true"
              />
              <span>
                <span className="font-semibold text-[#e8f4ff]">Sponsor</span>
                <span className="mt-0.5 block text-[13px] font-normal leading-snug text-[#a9abb5]">
                  Run campaigns and hire creators.
                </span>
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="nx-error" role="alert">
            <svg className="nx-error__icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
              <path d="M7 4v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <button className="nx-submit" type="submit" disabled={isLoading}>
          <span className="nx-submit-inner">
            {isLoading ? (
              <>
                <span className="nx-spinner" /> Saving…
              </>
            ) : (
              <>
                Continue
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 7h8M7 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
          onClick={() => void signOut({ redirectUrl: '/sign-in' })}
        >
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  )
}
