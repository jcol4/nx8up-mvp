/**
 * AuthLayout — full-screen auth shell (sign-in, sign-up, forgot-password, onboarding).
 * Uses the same HUD teal/cyan palette as the dashboards (no violet accents); keeps the
 * Auth shell layout (branding stack → portal card → children → footer).
 */
import Link from 'next/link'
import { Lexend, Space_Grotesk } from 'next/font/google'
import NxHudBackground from '@/components/nx-shell/NxHudBackground'
import { NX8UP_LOGO_SRC } from '@/lib/nx8up-logo'
import SocialTemplateLinks from '@/components/nx-shell/SocialTemplateLinks'

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-auth-display',
  display: 'swap',
})

const fontBody = Lexend({
  subsets: ['latin'],
  variable: '--font-auth-body',
  display: 'swap',
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fontDisplay.variable} ${fontBody.variable} nx-auth-root relative min-h-screen overflow-hidden font-[family-name:var(--font-auth-body)] text-[#e8f4ff] selection:bg-[#99f7ff]/35 selection:text-[#0f172a]`}
    >
      <NxHudBackground />

      <style>{`
        .nx-auth-root {
          --nx-a: #99f7ff;
          --nx-a-dim: rgb(153 247 255 / 22%);
          --nx-muted: #a9abb5;
          --nx-bright: #e8f4ff;
          --nx-top: #bffcff;
        }

        /* ── Background atmosphere (subtle; base grid comes from NxHudBackground) ── */
        .nx-auth-root .nx-light-leak {
          position: fixed;
          width: 60vw;
          height: 60vh;
          border-radius: 100%;
          filter: blur(120px);
          opacity: 0.07;
          z-index: 0;
          pointer-events: none;
        }
        .nx-auth-root .nx-nebula-glow {
          filter: blur(80px);
          opacity: 0.12;
          pointer-events: none;
        }
        @keyframes nx-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .nx-auth-root .nx-animate-float {
          animation: nx-float 6s ease-in-out infinite;
        }
        .nx-auth-root .nx-gradient-text {
          background: linear-gradient(135deg, #99f7ff 0%, #bffcff 45%, #67e8f9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* ── Glass portal card (matches dash-panel / HUD cards) ── */
        .nx-auth-root .nx-card {
          position: relative;
          background: rgb(8 14 28 / 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgb(255 255 255 / 14%);
          border-top: 2px solid var(--nx-top);
          border-radius: 0.75rem;
          box-shadow:
            0 25px 50px -12px rgb(0 0 0 / 0.45),
            inset 0 1px 0 rgb(255 255 255 / 0.04);
          padding: 2rem 2rem 1.5rem;
          width: 100%;
          max-width: 28rem;
          overflow: visible;
          z-index: 1;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        /* ── Shared form styles (nx-*) ── */
        .nx-auth-root .nx-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgb(153 247 255 / 0.08);
          border: 1px solid rgb(153 247 255 / 0.22);
          border-radius: 0.25rem;
          padding: 4px 10px;
          font-family: var(--font-auth-body), sans-serif;
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--nx-a);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }
        .nx-auth-root .nx-badge::before {
          content: '';
          width: 5px;
          height: 5px;
          background: var(--nx-a);
          border-radius: 50%;
          box-shadow: 0 0 8px rgb(153 247 255 / 50%);
          animation: pulse 2s ease-in-out infinite;
        }

        .nx-auth-root .nx-title {
          font-family: var(--font-auth-display), sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--nx-bright);
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        @media (min-width: 640px) {
          .nx-auth-root .nx-title { font-size: 1.75rem; }
        }
        .nx-auth-root .nx-title span {
          background: linear-gradient(135deg, #99f7ff, #bffcff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .nx-auth-root .nx-title-signin-plain {
          color: #ffffff;
        }
        .nx-auth-root .nx-title-signin-plain span {
          background: none;
          -webkit-background-clip: unset;
          background-clip: unset;
          -webkit-text-fill-color: unset;
          color: #ffffff;
        }

        .nx-auth-root .nx-subtitle {
          font-size: 0.875rem;
          color: var(--nx-muted);
          font-weight: 400;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .nx-auth-root .nx-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgb(153 247 255 / 22%),
            rgb(103 232 249 / 14%),
            transparent
          );
          margin-bottom: 1.5rem;
        }

        .nx-auth-root .nx-field { margin-bottom: 1.25rem; }

        .nx-auth-root .nx-label {
          display: block;
          font-family: var(--font-auth-body), sans-serif;
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgb(169 171 181 / 0.95);
          margin-bottom: 0.5rem;
        }

        .nx-auth-root .nx-input-wrap {
          position: relative;
          display: flex;
        }

        .nx-auth-root .nx-input {
          width: 100%;
          background: rgb(0 0 0 / 0.28);
          border: 1px solid rgb(255 255 255 / 10%);
          border-radius: 0.5rem;
          padding: 0.875rem 1rem;
          font-family: var(--font-auth-body), sans-serif;
          font-size: 1rem;
          color: var(--nx-bright);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .nx-auth-root .nx-input:focus {
          border-color: rgb(153 247 255 / 45%);
          box-shadow: 0 0 0 1px rgb(153 247 255 / 25%);
        }
        .nx-auth-root .nx-input::placeholder {
          color: rgb(169 171 181 / 0.45);
        }

        /* Native + custom chevron = double arrows; strip native with appearance:none */
        .nx-auth-root select.nx-input.nx-select {
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          /* ~14px icon + gap; avoid 3rem+ — narrow selects clip the closed option text */
          padding: 0.875rem 2.25rem 0.875rem 1rem;
          font-family: var(--font-auth-body), ui-sans-serif, system-ui, sans-serif;
          font-size: 1rem;
          line-height: 1.35;
          min-height: 2.875rem;
          background-color: rgb(0 0 0 / 0.28);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75l3.5-3.5' stroke='%2399f7ff' stroke-opacity='0.75' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.65rem center;
          background-size: 14px 14px;
          color-scheme: dark;
        }
        .nx-auth-root select.nx-input.nx-select::-ms-expand {
          display: none;
        }
        .nx-auth-root select.nx-input.nx-select option {
          font-family: var(--font-auth-body), ui-sans-serif, system-ui, sans-serif;
          background-color: rgb(15 23 42);
          color: var(--nx-bright);
        }
        .nx-auth-root select.nx-input.nx-select:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .nx-auth-root .nx-input--password {
          padding-right: 3rem;
        }
        .nx-auth-root .nx-input--code {
          font-size: 1.75rem;
          font-family: var(--font-auth-display), sans-serif;
          font-weight: 600;
          letter-spacing: 0.45em;
          text-align: center;
          color: var(--nx-a);
          padding: 1rem;
        }

        .nx-auth-root .nx-show-password {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--nx-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .nx-auth-root .nx-show-password:hover {
          color: var(--nx-a);
        }

        .nx-auth-root .nx-error {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          overflow: hidden;
          border: 1px solid rgb(248 113 113 / 0.5);
          border-radius: 0.5rem;
          padding: 0.95rem 1.15rem;
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1.5;
          color: rgb(255 241 242 / 0.98);
          background: rgb(118 34 42);
          box-shadow:
            0 0 0 1px rgb(0 0 0 / 0.35),
            0 4px 22px -6px rgb(220 38 38 / 0.28),
            inset 0 1px 0 rgb(255 255 255 / 0.06);
        }
        .nx-auth-root .nx-error__icon {
          flex-shrink: 0;
          margin-top: 2px;
          width: 18px;
          height: 18px;
          color: rgb(254 202 202);
          filter: drop-shadow(0 0 6px rgb(248 113 113 / 0.45));
        }

        .nx-auth-root .nx-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgb(153 247 255 / 0.06);
          border: 1px solid rgb(153 247 255 / 0.14);
          border-radius: 0.5rem;
          padding: 0.875rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.82rem;
          color: var(--nx-muted);
          line-height: 1.5;
        }

        .nx-auth-root .nx-success {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          overflow: hidden;
          border: 1px solid rgb(45 212 191 / 0.45);
          border-radius: 0.5rem;
          padding: 0.95rem 1.15rem;
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          line-height: 1.5;
          color: rgb(204 251 241 / 0.98);
          background: rgb(6 78 59 / 0.55);
          box-shadow:
            0 0 0 1px rgb(0 0 0 / 0.25),
            0 4px 22px -6px rgb(20 184 166 / 0.25),
            inset 0 1px 0 rgb(255 255 255 / 0.05);
        }
        .nx-auth-root .nx-success__icon {
          flex-shrink: 0;
          margin-top: 2px;
          width: 18px;
          height: 18px;
          color: rgb(94 234 212);
          filter: drop-shadow(0 0 6px rgb(45 212 191 / 0.4));
        }

        /* Primary CTA — matches dashboard teal buttons */
        .nx-auth-root .nx-submit {
          position: relative;
          width: 100%;
          overflow: visible;
          border: none;
          border-radius: 0.5rem;
          padding: 0;
          margin-top: 0.75rem;
          cursor: pointer;
          background: var(--nx-a);
          box-shadow:
            0 0 0 1px rgb(153 247 255 / 0.2),
            0 8px 28px -8px rgb(153 247 255 / 0.35);
          transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
        }
        .nx-auth-root .nx-submit::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 0.55rem;
          background: rgb(153 247 255 / 35%);
          filter: blur(12px);
          opacity: 0.4;
          z-index: -1;
          transition: opacity 0.2s ease;
        }
        .nx-auth-root .nx-submit:not(:disabled):hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          box-shadow:
            0 0 0 1px rgb(153 247 255 / 0.35),
            0 12px 32px -10px rgb(153 247 255 / 0.45);
        }
        .nx-auth-root .nx-submit:not(:disabled):hover::after {
          opacity: 0.55;
        }
        .nx-auth-root .nx-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .nx-auth-root .nx-submit-inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          font-family: var(--font-auth-display), sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0f172a;
        }

        .nx-auth-root .nx-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgb(15 23 42 / 0.2);
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: nx-spin 0.7s linear infinite;
        }
        @keyframes nx-spin {
          to { transform: rotate(360deg); }
        }

        .nx-auth-root .nx-footer {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 0.82rem;
          color: var(--nx-muted);
        }
        .nx-auth-root .nx-footer a,
        .nx-auth-root .nx-text-btn {
          color: var(--nx-a);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          background: none;
          border: none;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
          padding: 0;
        }
        .nx-auth-root .nx-text-btn--sm {
          font-size: 0.85rem;
        }
        .nx-auth-root .nx-text-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .nx-auth-root .nx-footer a:hover,
        .nx-auth-root .nx-text-btn:hover:not(:disabled) {
          color: var(--nx-top);
        }

        .nx-auth-root .nx-steps {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.5rem;
        }
        .nx-auth-root .nx-step {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-auth-body), sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .nx-auth-root .nx-step--active {
          color: var(--nx-a);
        }
        .nx-auth-root .nx-step--done {
          color: var(--nx-muted);
        }
        .nx-auth-root .nx-step--inactive {
          color: rgb(255 255 255 / 0.18);
        }
        .nx-auth-root .nx-step-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .nx-auth-root .nx-step-line {
          flex: 1;
          height: 1px;
          background: rgb(153 247 255 / 0.12);
        }

        .nx-auth-root .nx-hint {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--nx-muted);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .nx-auth-root .nx-hint::before {
          content: '//';
          color: var(--nx-a);
          opacity: 0.65;
          font-family: var(--font-auth-display), sans-serif;
          font-weight: 600;
        }

        .nx-auth-root .nx-xp-bar {
          margin-top: 2rem;
          margin-bottom: 1.5rem;
        }
        .nx-auth-root .nx-xp-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .nx-auth-root .nx-xp-label span {
          font-family: var(--font-auth-body), sans-serif;
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--nx-muted);
        }
        .nx-auth-root .nx-xp-label strong {
          font-family: var(--font-auth-display), sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--nx-a);
        }
        .nx-auth-root .nx-xp-track {
          height: 3px;
          background: rgb(153 247 255 / 0.1);
          border-radius: 999px;
          overflow: hidden;
        }
        .nx-auth-root .nx-xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #67e8f9, #99f7ff);
          border-radius: 999px;
          box-shadow: 0 0 10px rgb(153 247 255 / 0.35);
        }

        /* ── Soft ambient layer: organic blobs + horizon (no HUD rails/corners) ── */
        .nx-auth-root .nx-auth-ambient {
          position: fixed;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          overflow: hidden;
        }
        @keyframes nx-ambient-drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          40% { transform: translate(-3%, 4%) rotate(5deg) scale(1.04); }
          70% { transform: translate(4%, -3%) rotate(-4deg) scale(0.96); }
        }
        .nx-auth-root .nx-auth-ambient-blob {
          position: absolute;
          filter: blur(72px);
          opacity: 0.26;
          border-radius: 42% 58% 65% 35% / 45% 38% 62% 55%;
          animation: nx-ambient-drift 28s ease-in-out infinite;
        }
        .nx-auth-root .nx-auth-ambient-blob--a {
          width: min(72vmin, 520px);
          height: min(72vmin, 520px);
          top: -28%;
          right: -22%;
          background: linear-gradient(
            160deg,
            rgb(153 247 255 / 0.85) 0%,
            rgb(56 189 248 / 0.35) 45%,
            transparent 75%
          );
        }
        .nx-auth-root .nx-auth-ambient-blob--b {
          width: min(65vmin, 480px);
          height: min(65vmin, 480px);
          bottom: -24%;
          left: -26%;
          background: linear-gradient(
            25deg,
            rgb(34 211 238 / 0.55) 0%,
            rgb(14 116 144 / 0.25) 50%,
            transparent 78%
          );
          animation-duration: 34s;
          animation-delay: -12s;
          opacity: 0.2;
        }
        .nx-auth-root .nx-auth-ambient-blob--c {
          width: min(48vmin, 360px);
          height: min(48vmin, 360px);
          top: 38%;
          left: -18%;
          background: radial-gradient(
            circle at 40% 40%,
            rgb(191 252 255 / 0.35) 0%,
            rgb(153 247 255 / 0.12) 42%,
            transparent 70%
          );
          animation-duration: 22s;
          animation-delay: -6s;
          opacity: 0.18;
        }
        .nx-auth-root .nx-auth-ambient-horizon {
          position: absolute;
          left: -15%;
          right: -15%;
          bottom: -20%;
          height: min(52vh, 420px);
          background: radial-gradient(
            ellipse 75% 55% at 50% 100%,
            rgb(56 189 248 / 0.14) 0%,
            rgb(153 247 255 / 0.06) 38%,
            transparent 72%
          );
        }
        .nx-auth-root .nx-auth-ambient-sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            125deg,
            transparent 0%,
            rgb(255 255 255 / 0.02) 42%,
            transparent 58%
          );
          opacity: 0.9;
        }
      `}</style>

      {/* Soft atmosphere on top of HUD background */}
      <div className="nx-light-leak bg-[#99f7ff] top-[-10%] left-[-10%]" aria-hidden />
      <div className="nx-light-leak bg-[#22d3ee] bottom-[-10%] right-[-10%]" aria-hidden />
      <div className="nx-light-leak bg-[#99f7ff] top-[20%] right-[-5%]" aria-hidden />

      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center" aria-hidden>
        <div className="nx-nebula-glow h-[500px] w-[500px] -translate-x-20 -translate-y-20 rounded-full bg-[#99f7ff]" />
        <div className="nx-nebula-glow h-[400px] w-[400px] translate-x-20 translate-y-20 rounded-full bg-[#22d3ee]" />
      </div>

      {/* Soft ambient: drifting color blobs + bottom horizon (not technical/HUD) */}
      <div className="nx-auth-ambient" aria-hidden>
        <div className="nx-auth-ambient-blob nx-auth-ambient-blob--a" />
        <div className="nx-auth-ambient-blob nx-auth-ambient-blob--b" />
        <div className="nx-auth-ambient-blob nx-auth-ambient-blob--c" />
        <div className="nx-auth-ambient-horizon" />
        <div className="nx-auth-ambient-sheen" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-start px-6 pt-4 pb-12 sm:pt-7 sm:pb-16">
        {/* Branding */}
        <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
          <div className="relative mt-3 mb-0 sm:mt-4">
            <div className="absolute inset-0 blur-xl opacity-25 bg-[#99f7ff]" aria-hidden />
            <span className="relative nx-animate-float inline-flex text-[#99f7ff]" aria-hidden>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
                <line x1="6" x2="10" y1="11" y2="11" />
                <line x1="8" x2="8" y1="9" y2="13" />
                <line x1="15" x2="15.01" y1="12" y2="12" />
                <line x1="18" x2="18.01" y1="10" y2="10" />
                <line x1="17" x2="17.01" y1="14" y2="14" />
              </svg>
            </span>
          </div>
          <img
            src={NX8UP_LOGO_SRC}
            alt="nx8up"
            className="-mt-1 h-16 w-auto shrink-0 object-contain sm:h-20 md:h-24"
            decoding="async"
          />
          <p className="mt-2 font-[family-name:var(--font-auth-body)] text-nx-11 font-semibold uppercase tracking-[0.28em] text-[#99f7ff]">
            CREATE. CONTRACT. COLLECT.
          </p>
        </div>

        {/* Portal card */}
        <div className="nx-card mx-auto w-full">{children}</div>

        {/* System footer */}
        <footer className="mt-8 flex flex-col items-center gap-4 text-[#a9abb5]/50 sm:mt-10">
          <SocialTemplateLinks variant="auth" />
          <div className="flex gap-8">
            <Link
              href="/"
              className="font-[family-name:var(--font-auth-body)] text-nx-10 font-semibold uppercase tracking-widest transition-colors hover:text-[#99f7ff]"
            >
              Home
            </Link>
            <a
              href="#"
              className="font-[family-name:var(--font-auth-body)] text-nx-10 font-semibold uppercase tracking-widest transition-colors hover:text-[#99f7ff]"
            >
              Privacy
            </a>
            <a
              href="#"
              className="font-[family-name:var(--font-auth-body)] text-nx-10 font-semibold uppercase tracking-widest transition-colors hover:text-[#99f7ff]"
            >
              Support
            </a>
          </div>
          <p className="font-[family-name:var(--font-auth-body)] text-nx-9 uppercase tracking-widest text-[#a9abb5]/45">
            © 2025 NX8UP — Ascend your content
          </p>
        </footer>
      </main>
    </div>
  )
}
