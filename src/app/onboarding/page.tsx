'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'

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
      // Forces a token refresh and refreshes the `User` object
      await user?.reload()
      router.push('/')
    }
    if (res?.error) {
      setError(res?.error)
    }
  }
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .nx-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #060d18;
          background-image:
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0, 200, 255, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120, 60, 255, 0.05) 0%, transparent 60%),
            linear-gradient(180deg, #060d18 0%, #080f1f 100%);
          font-family: 'Exo 2', sans-serif;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .nx-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .nx-root::after {
          content: '';
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse, rgba(0,200,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .nx-topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: rgba(6, 13, 24, 0.9);
          border-bottom: 1px solid rgba(0, 200, 255, 0.12);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          padding: 0 2rem;
          z-index: 10;
        }

        .nx-logo {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.15em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nx-logo-icon {
          display: flex;
          gap: 2px;
          align-items: center;
        }

        .nx-logo-icon span {
          display: block;
          width: 3px;
          height: 14px;
          background: #00c8ff;
          border-radius: 1px;
        }
        .nx-logo-icon span:nth-child(2) { height: 10px; opacity: 0.7; }
        .nx-logo-icon span:nth-child(3) { height: 16px; }

        .nx-card {
          position: relative;
          background: rgba(10, 18, 35, 0.85);
          border: 1px solid rgba(0, 200, 255, 0.18);
          border-radius: 12px;
          padding: 2.5rem 3rem;
          width: 100%;
          max-width: 460px;
          z-index: 1;
          box-shadow:
            0 0 0 1px rgba(0,200,255,0.05),
            0 30px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(0,200,255,0.08);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .nx-card::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 15%;
          right: 15%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
          border-radius: 999px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nx-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 200, 255, 0.07);
          border: 1px solid rgba(0, 200, 255, 0.2);
          border-radius: 4px;
          padding: 3px 10px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #00c8ff;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
        }

        .nx-badge::before {
          content: '';
          width: 5px;
          height: 5px;
          background: #00c8ff;
          border-radius: 50%;
          box-shadow: 0 0 6px #00c8ff;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .nx-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: #e8f4ff;
          line-height: 1.1;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .nx-title span { color: #00c8ff; }

        .nx-subtitle {
          font-size: 0.875rem;
          color: #4a6080;
          font-weight: 300;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .nx-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(0,200,255,0.15), rgba(123,79,255,0.15), transparent);
          margin-bottom: 2rem;
        }

        .nx-label {
          display: block;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3a5570;
          margin-bottom: 0.5rem;
        }

        .nx-input-wrap {
          position: relative;
        }

        .nx-input-wrap::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #00c8ff, #7b4fff);
          border-radius: 2px 0 0 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nx-input-wrap:focus-within::before { opacity: 1; }

        .nx-input {
          width: 100%;
          background: rgba(0, 200, 255, 0.03);
          border: 1px solid rgba(0, 200, 255, 0.12);
          border-left: none;
          border-radius: 0 6px 6px 0;
          padding: 0.85rem 1rem;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.95rem;
          color: #c8dff0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          color-scheme: dark;
        }

        .nx-input:focus {
          border-color: rgba(0, 200, 255, 0.3);
          background: rgba(0, 200, 255, 0.05);
          box-shadow: 0 0 20px rgba(0, 200, 255, 0.06);
        }

        .nx-hint {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #2a3f55;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .nx-hint::before {
          content: '//';
          color: #00c8ff;
          opacity: 0.4;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
        }

        .nx-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 60, 100, 0.06);
          border: 1px solid rgba(255, 60, 100, 0.2);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin-top: 1.25rem;
          font-size: 0.82rem;
          color: #ff6b8a;
        }

        .nx-xp-bar { margin-top: 2rem; margin-bottom: 1.5rem; }

        .nx-xp-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .nx-xp-label span {
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3a5570;
        }

        .nx-xp-label strong {
          font-family: 'Rajdhani', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #00c8ff;
        }

        .nx-xp-track {
          height: 3px;
          background: rgba(0, 200, 255, 0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .nx-xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #00c8ff, #7b4fff);
          border-radius: 999px;
          box-shadow: 0 0 8px rgba(0, 200, 255, 0.5);
        }

        .nx-submit {
          width: 100%;
          padding: 0.9rem;
          background: transparent;
          border: 1px solid rgba(0, 200, 255, 0.35);
          border-radius: 6px;
          color: #00c8ff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .nx-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,200,255,0.1), rgba(123,79,255,0.1));
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nx-submit:hover:not(:disabled)::before { opacity: 1; }

        .nx-submit:hover:not(:disabled) {
          border-color: rgba(0, 200, 255, 0.6);
          box-shadow: 0 0 20px rgba(0, 200, 255, 0.15), inset 0 0 20px rgba(0, 200, 255, 0.04);
          color: #4de0ff;
        }

        .nx-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        .nx-submit-inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .nx-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0,200,255,0.2);
          border-top-color: #00c8ff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .nx-footer {
          margin-top: 1.5rem;
          font-size: 0.7rem;
          color: #1e2f42;
          text-align: center;
          font-family: 'Rajdhani', sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .nx-corner {
          position: absolute;
          width: 12px;
          height: 12px;
        }
        .nx-corner--tl { top: -1px; left: -1px; border-top: 2px solid #00c8ff; border-left: 2px solid #00c8ff; }
        .nx-corner--tr { top: -1px; right: -1px; border-top: 2px solid #00c8ff; border-right: 2px solid #00c8ff; }
        .nx-corner--bl { bottom: -1px; left: -1px; border-bottom: 2px solid #7b4fff; border-left: 2px solid #7b4fff; }
        .nx-corner--br { bottom: -1px; right: -1px; border-bottom: 2px solid #7b4fff; border-right: 2px solid #7b4fff; }
      `}</style>

      <div className="nx-topbar">
        <div className="nx-logo">
          <div className="nx-logo-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
          NX8UP
        </div>
      </div>

      <div className="nx-root">
        <div className="nx-card">
          <div className="nx-corner nx-corner--tl" />
          <div className="nx-corner nx-corner--tr" />
          <div className="nx-corner nx-corner--bl" />
          <div className="nx-corner nx-corner--br" />

          <div className="nx-badge">Age Verification</div>

          <h1 className="nx-title">Access <span>Protocol</span></h1>
          <p className="nx-subtitle">
            NX8UP is restricted to users 18 and older. Confirm your date of birth to unlock your account and begin your missions.
          </p>

          <div className="nx-divider" />

          <form action={handleSubmit}>
            <div>
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
                  <>
                    <span className="nx-spinner" />
                    Verifying...
                  </>
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
        </div>
      </div>
    </>
  )
}