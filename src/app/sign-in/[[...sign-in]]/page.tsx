import { SignIn } from '@clerk/nextjs'
import { nxTheme } from '@/lib/clerkTheme'

export default function SignInPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500&display=swap');

        body { margin: 0; }

        .nx-signin-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #060d18;
          background-image:
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0, 200, 255, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120, 60, 255, 0.05) 0%, transparent 60%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .nx-signin-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        .nx-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
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

        /* Override Clerk's root card background so our outer bg shows through */
        .cl-rootBox { background: transparent !important; box-shadow: none !important; }
        .cl-card { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Focus glow on inputs */
        .cl-formFieldInput:focus {
          border-color: rgba(0, 200, 255, 0.3) !important;
          box-shadow: 0 0 0 3px rgba(0, 200, 255, 0.06) !important;
        }

        /* Hover on social buttons */
        .cl-socialButtonsBlockButton:hover {
          border-color: rgba(0, 200, 255, 0.3) !important;
          background: rgba(0, 200, 255, 0.06) !important;
        }
      `}</style>

      <div className="nx-topbar">
        <div className="nx-logo">
          <div className="nx-logo-icon">
            <span></span><span></span><span></span>
          </div>
          NX8UP
        </div>
      </div>

      <div className="nx-signin-root">
        <SignIn appearance={nxTheme} />
      </div>
    </>
  )
}