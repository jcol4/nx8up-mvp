/**
 * @file onboarding/page.tsx
 *
 * Client-side onboarding: date of birth (18+) and role (creator | sponsor).
 * Terms modal must be accepted before completing onboarding.
 */
'use client'

import * as React from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { AuthLayout } from '@/components/layout'
import { BirthdateSelect } from '@/components/ui'

function OnboardingTermsContent() {
  return (
    <div className="space-y-4 text-left text-nx-13 leading-relaxed text-[#a9abb5]">
      <p className="text-[#e8f4ff]">
        These terms summarize how we expect you to use nx8up. They are not a substitute for
        professional legal advice; your counsel should review them before you rely on them in
        production.
      </p>
      <section>
        <h3 className="mb-1 font-semibold text-[#e8f4ff]">Eligibility and your account</h3>
        <p>
          You confirm you are at least 18 years old. You agree to provide accurate information and
          to keep your login credentials secure. You are responsible for activity under your
          account.
        </p>
      </section>
      <section>
        <h3 className="mb-1 font-semibold text-[#e8f4ff]">Creators and sponsors</h3>
        <p>
          You will use the platform in good faith. Creators and sponsors are expected to honor
          commitments they make through campaigns and communications, comply with applicable laws
          (including advertising and disclosure rules), and respect others’ rights—including
          intellectual property and privacy.
        </p>
      </section>
      <section>
        <h3 className="mb-1 font-semibold text-[#e8f4ff]">Content and license</h3>
        <p>
          You retain rights to content you submit, but grant nx8up a limited license to host,
          display, and operate the service with that content as reasonably needed for the product.
        </p>
      </section>
      <section>
        <h3 className="mb-1 font-semibold text-[#e8f4ff]">Disclaimers and limitation</h3>
        <p>
          The service is provided “as is” to the maximum extent permitted by law. To the extent
          permitted, nx8up is not liable for indirect or consequential damages arising from your use
          of the platform.
        </p>
      </section>
      <section>
        <h3 className="mb-1 font-semibold text-[#e8f4ff]">Changes and contact</h3>
        <p>
          We may update these terms; continued use after changes constitutes acceptance of the
          revised terms where permitted by law. For questions, contact us through the channels
          listed on the site.
        </p>
      </section>
    </div>
  )
}

export default function OnboardingComponent() {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showTermsModal, setShowTermsModal] = React.useState(false)
  const [termsReadChecked, setTermsReadChecked] = React.useState(false)
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  const maxDob = React.useMemo(() => new Date().toISOString().split('T')[0], [])
  const minDob = React.useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 120)
    return d.toISOString().split('T')[0]
  }, [])

  const closeTermsModal = React.useCallback(() => {
    setShowTermsModal(false)
    setTermsReadChecked(false)
  }, [])

  React.useEffect(() => {
    if (!showTermsModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTermsModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showTermsModal, closeTermsModal])

  const validateForm = React.useCallback((): boolean => {
    const form = formRef.current
    if (!form) return false
    const fd = new FormData(form)
    const dob = (fd.get('userDateOfBirth') as string | null) ?? ''
    const role = (fd.get('role') as string | null) ?? ''
    if (!dob.trim()) {
      setError('Select your date of birth.')
      return false
    }
    if (!role) {
      setError('Choose Creator or Sponsor.')
      return false
    }
    return true
  }, [])

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setTermsReadChecked(false)
    setShowTermsModal(true)
  }

  const confirmTermsAndOnboard = async () => {
    if (!termsReadChecked || !formRef.current) return
    setError('')
    setIsLoading(true)
    const formData = new FormData(formRef.current)
    const res = await completeOnboarding(formData)
    if (res?.message) {
      setShowTermsModal(false)
      await user?.reload()
      const roleFromRes = (res.message as { role?: string })?.role
      if (roleFromRes === 'creator') router.push('/creator')
      else if (roleFromRes === 'sponsor') router.push('/sponsor')
      else router.push('/')
    }
    if (res?.error) {
      setError(res.error)
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

      <div className="mt-4 rounded-lg border border-[#99f7ff]/20 bg-[#99f7ff]/[0.06] px-4 py-3 text-nx-13 leading-relaxed text-[#a9abb5]">
        <span className="font-semibold text-[#99f7ff]">Beta notice: </span>
        nx8up is currently in a testing phase and is free to use. Pricing may be introduced once we officially launch.
      </div>

      <div className="nx-divider" />

      <form ref={formRef} noValidate onSubmit={onFormSubmit}>
        <div className="nx-field">
          <span className="nx-label">Date of birth</span>
          <BirthdateSelect name="userDateOfBirth" max={maxDob} min={minDob} />
          <p className="mt-2 text-center text-nx-12 leading-relaxed text-[#a9abb5]">
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
                <span className="mt-0.5 block text-nx-13 font-normal leading-snug text-[#a9abb5]">
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
                <span className="mt-0.5 block text-nx-13 font-normal leading-snug text-[#a9abb5]">
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

        <button className="nx-submit" type="submit" disabled={isLoading || showTermsModal}>
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

      {showTermsModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeTermsModal()
          }}
        >
          <div
            className="absolute inset-0 bg-[#030712]/75 backdrop-blur-sm"
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-terms-title"
            className="relative z-[1] flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/[0.14] bg-[rgb(8_14_28_/0.96)] shadow-[0_25px_50px_-12px_rgb(0_0_0_/0.5)]"
          >
            <div className="border-b border-white/[0.08] px-5 py-4">
              <h2 id="onboarding-terms-title" className="text-lg font-semibold text-[#e8f4ff]">
                Terms and conditions
              </h2>
              <p className="mt-1 text-nx-12 text-[#a9abb5]">
                Please read before finishing account setup.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <OnboardingTermsContent />
            </div>
            <div className="border-t border-white/[0.08] px-5 py-4">
              <label className="flex cursor-pointer items-start gap-3 text-left text-nx-13 text-[#e8f4ff]">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 rounded border border-white/20 bg-black/30 accent-[#99f7ff]"
                  checked={termsReadChecked}
                  onChange={(e) => setTermsReadChecked(e.target.checked)}
                />
                <span>I have read and agree to these terms and conditions.</span>
              </label>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="nx-text-btn w-full justify-center py-2 sm:w-auto"
                  onClick={closeTermsModal}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="nx-submit w-full sm:w-auto"
                  disabled={!termsReadChecked || isLoading}
                  onClick={() => void confirmTermsAndOnboard()}
                >
                  <span className="nx-submit-inner">
                    {isLoading ? (
                      <>
                        <span className="nx-spinner" /> Saving…
                      </>
                    ) : (
                      'Agree and continue'
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
