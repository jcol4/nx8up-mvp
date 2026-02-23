import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,200,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120,60,255,0.05) 0%, transparent 60%);
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
          pointer-events: none;
        }

        .nx-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: rgba(6,13,24,0.9);
          border-bottom: 1px solid rgba(0,200,255,0.12);
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
          text-decoration: none;
        }

        .nx-logo-icon { display: flex; gap: 2px; align-items: center; }
        .nx-logo-icon span { display: block; width: 3px; height: 14px; background: #00c8ff; border-radius: 1px; }
        .nx-logo-icon span:nth-child(2) { height: 10px; opacity: 0.7; }
        .nx-logo-icon span:nth-child(3) { height: 16px; }

        .nx-card {
          position: relative;
          background: rgba(10,18,35,0.85);
          border: 1px solid rgba(0,200,255,0.18);
          border-radius: 12px;
          padding: 2.5rem 3rem;
          width: 100%;
          max-width: 460px;
          z-index: 1;
          box-shadow:
            0 0 0 1px rgba(0,200,255,0.05),
            0 30px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(0,200,255,0.08);
          animation: slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }

        .nx-card::before {
          content: '';
          position: absolute;
          top: -1px; left: 15%; right: 15%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
          border-radius: 999px;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .nx-corner { position: absolute; width: 12px; height: 12px; }
        .nx-corner--tl { top: -1px; left: -1px; border-top: 2px solid #00c8ff; border-left: 2px solid #00c8ff; }
        .nx-corner--tr { top: -1px; right: -1px; border-top: 2px solid #00c8ff; border-right: 2px solid #00c8ff; }
        .nx-corner--bl { bottom: -1px; left: -1px; border-bottom: 2px solid #7b4fff; border-left: 2px solid #7b4fff; }
        .nx-corner--br { bottom: -1px; right: -1px; border-bottom: 2px solid #7b4fff; border-right: 2px solid #7b4fff; }

        /* ── Shared form styles used across all auth pages ── */

        .nx-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,200,255,0.07);
          border: 1px solid rgba(0,200,255,0.2);
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
          width: 5px; height: 5px;
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

        .nx-field { margin-bottom: 1.25rem; }

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

        .nx-input-wrap { position: relative; display: flex; }

        .nx-input-wrap::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #00c8ff, #7b4fff);
          border-radius: 2px 0 0 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nx-input-wrap:focus-within::before { opacity: 1; }

        .nx-input {
          width: 100%;
          background: rgba(0,200,255,0.03);
          border: 1px solid rgba(0,200,255,0.12);
          border-left: none;
          border-radius: 0 6px 6px 0;
          padding: 0.85rem 1rem;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.95rem;
          color: #c8dff0;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .nx-input:focus {
          border-color: rgba(0,200,255,0.3);
          background: rgba(0,200,255,0.05);
          box-shadow: 0 0 20px rgba(0,200,255,0.06);
        }

        .nx-input--password { padding-right: 3rem; }
        .nx-input--code {
          font-size: 1.8rem;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          letter-spacing: 0.5em;
          text-align: center;
          color: #00c8ff;
          padding: 1rem;
        }
        .nx-input::placeholder { color: #2a3f55; }

        .nx-show-password {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #3a5570;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .nx-show-password:hover { color: #00c8ff; }

        .nx-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,60,100,0.06);
          border: 1px solid rgba(255,60,100,0.2);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          font-size: 0.82rem;
          color: #ff6b8a;
        }

        .nx-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(0,200,255,0.04);
          border: 1px solid rgba(0,200,255,0.15);
          border-radius: 6px;
          padding: 0.875rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.82rem;
          color: #4a8fa8;
          line-height: 1.5;
        }

        .nx-info svg { flex-shrink: 0; margin-top: 1px; }

        .nx-submit {
          width: 100%;
          padding: 0.9rem;
          background: transparent;
          border: 1px solid rgba(0,200,255,0.35);
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
          margin-top: 0.5rem;
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
          border-color: rgba(0,200,255,0.6);
          box-shadow: 0 0 20px rgba(0,200,255,0.15), inset 0 0 20px rgba(0,200,255,0.04);
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
          width: 14px; height: 14px;
          border: 2px solid rgba(0,200,255,0.2);
          border-top-color: #00c8ff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .nx-footer {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.82rem;
          color: #3a5570;
        }

        .nx-footer a, .nx-text-btn {
          color: #00c8ff;
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

        .nx-footer a:hover, .nx-text-btn:hover { color: #4de0ff; }

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
          background: rgba(0,200,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .nx-xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #00c8ff, #7b4fff);
          border-radius: 999px;
          box-shadow: 0 0 8px rgba(0,200,255,0.5);
        }

        .nx-steps {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.5rem;
        }

        .nx-step {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .nx-step--active { color: #00c8ff; }
        .nx-step--done { color: #3a5570; }
        .nx-step--inactive { color: #2a3a4a; }

        .nx-step-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .nx-step--active .nx-step-dot { box-shadow: 0 0 6px #00c8ff; }

        .nx-step-line {
          flex: 1;
          height: 1px;
          background: rgba(0,200,255,0.1);
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
      `}</style>

      <div className="nx-topbar">
        <Link href="/" className="nx-logo">
          <div className="nx-logo-icon">
            <span /><span /><span />
          </div>
          NX8UP
        </Link>
      </div>

      <div className="nx-root">
        <div className="nx-card">
          <div className="nx-corner nx-corner--tl" />
          <div className="nx-corner nx-corner--tr" />
          <div className="nx-corner nx-corner--bl" />
          <div className="nx-corner nx-corner--br" />
          {children}
        </div>
      </div>
    </>
  )
}