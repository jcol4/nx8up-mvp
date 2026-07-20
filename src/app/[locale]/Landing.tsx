/**
 * @file Landing.tsx
 * @description Public marketing landing page for nx8up, shown to visitors who are
 * not signed in on this browser. Aimed at new users: introduces the platform and
 * routes them into the creator or sponsor sign-up / sign-in flows.
 *
 * This is a server component with no interactivity — all CTAs are plain links to the
 * flat auth routes (/sign-in, /sign-up). Rough draft: copy is hardcoded in English
 * rather than pulled from the i18n message catalog.
 *
 * Rendered by src/app/[locale]/page.tsx only when there is no authenticated user.
 */
import Link from 'next/link'
import Image from 'next/image'

export default function Landing() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500&display=swap');

        .lp-root {
          --cyan: #00c8ff;
          --purple: #7b4fff;
          min-height: 100vh;
          background-color: #050a14;
          background-image:
            radial-gradient(ellipse 80% 50% at 25% 15%, rgba(0,200,255,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 80% 20%, rgba(120,60,255,0.10) 0%, transparent 55%),
            radial-gradient(ellipse 120% 60% at 50% 100%, rgba(123,79,255,0.06) 0%, transparent 60%);
          font-family: 'Exo 2', sans-serif;
          color: #c8dff0;
          position: relative;
          overflow-x: hidden;
        }

        .lp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,200,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(ellipse 90% 70% at 50% 0%, black 10%, transparent 90%);
          pointer-events: none;
        }

        /* ── Topbar / nav ─────────────────────────────── */
        .lp-nav {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2.5rem;
          border-bottom: 1px solid rgba(0,200,255,0.08);
        }
        .lp-nav-links {
          display: flex;
          gap: 2.25rem;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 0.8125rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .lp-nav-links a { color: #9fb6cc; text-decoration: none; transition: color 0.2s; }
        .lp-nav-links a:hover { color: var(--cyan); }
        .lp-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.55rem 1.25rem;
          border: 1px solid rgba(0,200,255,0.35);
          border-radius: 7px;
          color: #e8f4ff;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 0.8125rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.2s, box-shadow 0.2s, color 0.2s;
        }
        .lp-login-btn:hover {
          border-color: var(--cyan);
          color: var(--cyan);
          box-shadow: 0 0 24px rgba(0,200,255,0.15);
        }

        /* ── Hero ─────────────────────────────────────── */
        .lp-hero {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 4rem 1.5rem 2.5rem;
          max-width: 820px;
          margin: 0 auto;
        }
        .lp-eyebrow {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--cyan);
          margin-bottom: 0.75rem;
        }
        .lp-hero h1 {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: clamp(3rem, 9vw, 6rem);
          line-height: 0.95;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #f0f8ff;
          margin: 0 0 1.25rem;
          text-shadow: 0 0 40px rgba(0,200,255,0.15);
        }
        .lp-hero h1 .lp-line2 {
          background: linear-gradient(90deg, #8fd8ff, #ffffff 60%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-hero p {
          font-size: 1.0625rem;
          line-height: 1.65;
          color: #7d94ad;
          font-weight: 300;
          max-width: 560px;
          margin: 0 auto;
        }

        /* ── Role cards ───────────────────────────────── */
        .lp-cards {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 1000px;
          margin: 2.5rem auto 0;
          padding: 0 1.5rem;
        }
        .lp-card {
          position: relative;
          border-radius: 16px;
          padding: 2.25rem 2rem 2rem;
          background: rgba(8,15,30,0.72);
          border: 1px solid var(--accent-dim);
          box-shadow: 0 0 40px -12px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.03);
          backdrop-filter: blur(6px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .lp-card--creator { --accent: var(--cyan); --accent-dim: rgba(0,200,255,0.3); --accent-glow: rgba(0,200,255,0.35); }
        .lp-card--sponsor { --accent: var(--purple); --accent-dim: rgba(123,79,255,0.35); --accent-glow: rgba(123,79,255,0.4); }

        .lp-badge {
          position: absolute;
          top: 1.1rem;
          right: 1.1rem;
          text-align: right;
          border: 1px solid rgba(255,196,0,0.5);
          border-radius: 8px;
          padding: 0.35rem 0.6rem;
          background: rgba(255,196,0,0.06);
          line-height: 1.1;
        }
        .lp-badge small { display: block; font-family: 'Rajdhani', sans-serif; font-size: 0.55rem; letter-spacing: 0.14em; color: #ffd24d; text-transform: uppercase; }
        .lp-badge strong { font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 700; color: #ffcc33; letter-spacing: 0.04em; }

        .lp-card-icon {
          width: 58px; height: 58px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem;
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border: 1px solid var(--accent-dim);
        }
        .lp-card-kicker {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #7d94ad;
        }
        .lp-card h2 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #f0f8ff;
          margin: 0.15rem 0 1.25rem;
          line-height: 1.05;
        }
        .lp-feat {
          list-style: none;
          margin: 0 0 1.75rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          align-self: stretch;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }
        .lp-feat li {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.9375rem;
          color: #b3c6da;
        }
        .lp-feat li svg { color: var(--accent); flex-shrink: 0; }

        .lp-actions {
          display: flex;
          align-items: stretch;
          width: 100%;
          max-width: 340px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid var(--accent-dim);
          box-shadow: 0 0 26px -8px var(--accent-glow);
        }
        .lp-actions a {
          flex: 1;
          padding: 0.9rem 0.5rem;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.9375rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          text-align: center;
          transition: background 0.2s, color 0.2s;
        }
        .lp-actions .lp-act-login {
          color: #dfeeff;
          background: color-mix(in srgb, var(--accent) 16%, transparent);
        }
        .lp-actions .lp-act-login:hover { background: color-mix(in srgb, var(--accent) 30%, transparent); }
        .lp-actions .lp-act-or {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          padding: 0 0.6rem;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: #6a819a;
          background: rgba(0,0,0,0.25);
        }
        .lp-actions .lp-act-create {
          color: #ffffff;
          background: color-mix(in srgb, var(--accent) 55%, #0a1020);
        }
        .lp-actions .lp-act-create:hover { background: var(--accent); }

        .lp-card-foot {
          margin-top: 1rem;
          font-size: 0.8125rem;
          color: #6a819a;
        }
        .lp-card-foot a { color: var(--accent); text-decoration: none; font-weight: 500; }
        .lp-card-foot a:hover { text-decoration: underline; }

        /* ── How it works ─────────────────────────────── */
        .lp-how {
          position: relative;
          z-index: 2;
          max-width: 900px;
          margin: 4.5rem auto 0;
          padding: 0 1.5rem;
          text-align: center;
        }
        .lp-how h3 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #cfe4f7;
          margin-bottom: 2rem;
        }
        .lp-how h3 span { color: var(--cyan); }
        .lp-steps {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .lp-step { flex: 1; min-width: 180px; max-width: 240px; text-align: center; }
        .lp-step-num {
          width: 52px; height: 52px;
          margin: 0 auto 0.85rem;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--cyan);
          background: rgba(0,200,255,0.07);
          border: 1px solid rgba(0,200,255,0.18);
        }
        .lp-step h4 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #e2f0ff;
          margin-bottom: 0.4rem;
        }
        .lp-step h4 b { color: var(--cyan); font-weight: 700; }
        .lp-step p { font-size: 0.875rem; color: #7d94ad; line-height: 1.5; font-weight: 300; }
        .lp-step-arrow { color: #33506b; align-self: center; padding-top: 0.75rem; }

        /* ── Trusted by ───────────────────────────────── */
        .lp-trusted {
          position: relative;
          z-index: 2;
          max-width: 1000px;
          margin: 4.5rem auto 0;
          padding: 0 1.5rem;
          text-align: center;
        }
        .lp-trusted-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--cyan);
          margin-bottom: 1.5rem;
        }
        .lp-logos {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem 2.5rem;
        }
        .lp-logos span {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.08em;
          color: #556f88;
          opacity: 0.8;
        }

        /* ── Bottom banner ────────────────────────────── */
        .lp-banner {
          position: relative;
          z-index: 2;
          margin-top: 4.5rem;
          padding: 3rem 1.5rem 3.5rem;
          text-align: center;
          border-top: 1px solid rgba(0,200,255,0.1);
          background: linear-gradient(180deg, transparent, rgba(0,200,255,0.03));
        }
        .lp-banner h3 {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(1.25rem, 3.5vw, 1.9rem);
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #e2f0ff;
          margin-bottom: 0.6rem;
        }
        .lp-banner h3 span { color: var(--cyan); }
        .lp-banner p { font-size: 1rem; color: #7d94ad; font-weight: 300; max-width: 560px; margin: 0 auto; }

        @media (max-width: 760px) {
          .lp-nav { padding: 1rem 1.25rem; }
          .lp-nav-links { display: none; }
          .lp-cards { grid-template-columns: 1fr; }
          .lp-step-arrow { display: none; }
        }
      `}</style>

      <div className="lp-root">
        {/* Nav */}
        <nav className="lp-nav">
          <Image src="/nx8up_logo_transparent.png" alt="nx8up" width={130} height={40} priority style={{ height: 'auto', width: '130px' }} />
          <div className="lp-nav-links">
            <a href="#creators">For Creators</a>
            <a href="#sponsors">For Sponsors</a>
            <a href="#how">About</a>
          </div>
          <Link href="/sign-in" className="lp-login-btn">
            Log In
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </nav>

        {/* Hero */}
        <header className="lp-hero">
          <div className="lp-eyebrow">The Sponsorship Platform</div>
          <h1>Built For<br /><span className="lp-line2">Esports</span></h1>
          <p>Connect with sponsorship opportunities, manage campaigns, grow your brand, and turn your community into revenue.</p>
        </header>

        {/* Role cards */}
        <section className="lp-cards">
          {/* Creator */}
          <div className="lp-card lp-card--creator" id="creators">
            <div className="lp-card-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="4" />
                <path d="M7 12h.01M10 12h.01M7 10v4M16 11h.01M18 13h.01" />
              </svg>
            </div>
            <div className="lp-card-kicker">I&apos;m an</div>
            <h2>Esports<br />Player / Creator</h2>
            <ul className="lp-feat">
              <li><Check /> Create your profile</li>
              <li><Check /> Discover sponsorship opportunities</li>
              <li><Check /> Manage campaigns</li>
              <li><Check /> Grow your career</li>
            </ul>
            <div className="lp-actions">
              <Link href="/sign-in" className="lp-act-login">Log In</Link>
              <span className="lp-act-or">or</span>
              <Link href="/sign-up" className="lp-act-create">Create Account</Link>
            </div>
            <div className="lp-card-foot">Already have an account? <Link href="/sign-in">Log In</Link></div>
          </div>

          {/* Sponsor */}
          <div className="lp-card lp-card--sponsor" id="sponsors">
            <div className="lp-badge">
              <small>Limited Time Offer</small>
              <strong>Get 6 Months Free</strong>
            </div>
            <div className="lp-card-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                <path d="M17 5h2.5a1.5 1.5 0 0 1 0 5H17M7 5H4.5a1.5 1.5 0 0 0 0 5H7" />
              </svg>
            </div>
            <div className="lp-card-kicker">I&apos;m a</div>
            <h2>Sponsor / Brand</h2>
            <ul className="lp-feat">
              <li><Check /> Find creators that fit your audience</li>
              <li><Check /> Launch sponsorship campaigns</li>
              <li><Check /> Track performance</li>
              <li><Check /> Measure ROI</li>
            </ul>
            <div className="lp-actions">
              <Link href="/sign-in" className="lp-act-login">Log In</Link>
              <span className="lp-act-or">or</span>
              <Link href="/sign-up" className="lp-act-create">Create Account</Link>
            </div>
            <div className="lp-card-foot">Already have an account? <Link href="/sign-in">Log In</Link></div>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-how" id="how">
          <h3>How NX<span>8</span>UP Works</h3>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
              </div>
              <h4>1. <b>Create</b></h4>
              <p>Build your esports profile in minutes.</p>
            </div>
            <div className="lp-step-arrow">
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h18M14 2l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12h.01M12 12h.01M16 12h.01M4 8l3 3-3 3M20 8l-3 3 3 3" /><rect x="2" y="4" width="20" height="16" rx="3" /></svg>
              </div>
              <h4>2. <b>Connect</b></h4>
              <p>Get matched with sponsorship opportunities.</p>
            </div>
            <div className="lp-step-arrow">
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h18M14 2l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /><path d="M19 7h0v4" /></svg>
              </div>
              <h4>3. <b>Grow</b></h4>
              <p>Manage campaigns and build long-term partnerships.</p>
            </div>
          </div>
        </section>

        {/* Trusted by */}
        <section className="lp-trusted">
          <div className="lp-trusted-label">Trusted by the next generation of esports creators and industry leaders</div>
          <div className="lp-logos">
            <span>USF</span>
            <span>UCSB</span>
            <span>CBLOL</span>
            <span>Esports Brazil</span>
            <span>University Esports Masters</span>
            <span>HSEL</span>
            <span>TESPA</span>
          </div>
        </section>

        {/* Bottom banner */}
        <section className="lp-banner">
          <h3><span>Billions</span> of sponsorship dollars are being left on the table.</h3>
          <p>NX8UP helps creators earn more while helping brands reach authentic gaming communities.</p>
        </section>
      </div>
    </>
  )
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 4L6 11L3 8" />
    </svg>
  )
}
