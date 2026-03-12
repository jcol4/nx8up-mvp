import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HomeQuickAccessCard from '@/components/shared/HomeQuickAccessCard'
import Image from 'next/image'
import { SignOutButton } from '@clerk/nextjs'

export default async function HomePage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const role = (sessionClaims?.metadata as any)?.role as string | undefined
  const username = user?.username ?? user?.firstName ?? 'Player'

  const dashboardLink =
    role === 'admin' ? '/admin' :
    role === 'creator' ? '/creator' :
    role === 'sponsor' ? '/sponsor' :
    null

  const dashboardLabel =
    role === 'admin' ? 'Admin Dashboard' :
    role === 'creator' ? 'Creator Dashboard' :
    role === 'sponsor' ? 'Sponsor Dashboard' :
    null

  const roleColor =
    role === 'admin' ? '#ff6b8a' :
    role === 'creator' ? '#00c8ff' :
    role === 'sponsor' ? '#7b4fff' :
    '#3a5570'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background-color: #060d18;
          background-image:
            radial-gradient(ellipse 100% 50% at 50% 0%, rgba(0,200,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120,60,255,0.04) 0%, transparent 60%);
          font-family: 'Exo 2', sans-serif;
          color: #c8dff0;
          position: relative;
          overflow: hidden;
        }

        .home-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 30%, black 20%, transparent 100%);
          pointer-events: none;
        }

        /* Topbar */
        .home-topbar {
          position: sticky;
          top: 0;
          height: 56px;
          background: rgba(6,13,24,0.9);
          border-bottom: 1px solid rgba(0,200,255,0.12);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          z-index: 10;
        }

        .home-topbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .home-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 4px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: 1px solid;
        }

        .home-sign-out {
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3a5570;
          text-decoration: none;
          transition: color 0.2s;
        }

        .home-sign-out:hover { color: #ff6b8a; }

        /* Hero */
        .home-body {
          max-width: 900px;
          margin: 0 auto;
          padding: 5rem 2rem 4rem;
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .home-greeting {
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #3a5570;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .home-greeting::before,
        .home-greeting::after {
          content: '';
          height: 1px;
          width: 40px;
          background: linear-gradient(90deg, transparent, rgba(0,200,255,0.2));
        }

        .home-greeting::after {
          background: linear-gradient(90deg, rgba(0,200,255,0.2), transparent);
        }

        .home-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          color: #e8f4ff;
          line-height: 1.05;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
        }

        .home-title span { color: #00c8ff; }

        .home-subtitle {
          font-size: 1rem;
          color: #4a6080;
          font-weight: 300;
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 3.5rem;
        }

        /* Dashboard CTA */
        .home-cta {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 4rem;
        }

        .home-dashboard-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 1rem 2.5rem;
          background: transparent;
          border: 1px solid rgba(0,200,255,0.35);
          border-radius: 8px;
          color: #00c8ff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .home-dashboard-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,200,255,0.08), rgba(123,79,255,0.08));
          opacity: 0;
          transition: opacity 0.2s;
        }

        .home-dashboard-btn:hover::before { opacity: 1; }
        .home-dashboard-btn:hover {
          border-color: rgba(0,200,255,0.6);
          box-shadow: 0 0 30px rgba(0,200,255,0.12), inset 0 0 20px rgba(0,200,255,0.04);
          color: #4de0ff;
        }

        .home-btn-icon {
          width: 36px; height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,200,255,0.08);
          border: 1px solid rgba(0,200,255,0.15);
          flex-shrink: 0;
          position: relative;
        }

        .home-btn-label {
          font-size: 11px;
          color: #3a5570;
          font-family: 'Rajdhani', sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Quick links grid */
        .home-section-label {
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3a5570;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .home-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(0,200,255,0.1), transparent);
        }

        .home-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          text-align: left;
        }

        .home-card {
          background: rgba(10,18,35,0.8);
          border: 1px solid rgba(0,200,255,0.1);
          border-radius: 10px;
          padding: 1.5rem;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }

        .home-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,200,255,0.2), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .home-card:hover {
          border-color: rgba(0,200,255,0.25);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }

        .home-card:hover::before { opacity: 1; }

        .home-card-icon {
          width: 38px; height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          background: rgba(0,200,255,0.06);
          border: 1px solid rgba(0,200,255,0.12);
        }

        .home-card-title {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #c8dff0;
          margin-bottom: 0.35rem;
        }

        .home-card-desc {
          font-size: 0.78rem;
          color: #3a5570;
          font-weight: 300;
          line-height: 1.5;
        }

        .home-card-arrow {
          position: absolute;
          bottom: 1.25rem;
          right: 1.25rem;
          color: #2a3f55;
          transition: color 0.2s, transform 0.2s;
        }

        .home-card:hover .home-card-arrow {
          color: #00c8ff;
          transform: translate(2px, -2px);
        }

        @media (max-width: 640px) {
          .home-grid { grid-template-columns: 1fr; }
          .home-body { padding: 3rem 1rem; }
        }
      `}</style>

      <div className="home-root">
        <div className="home-topbar">
          <Link href="/">
            <Image src="/nx8up_logo_transparent.png" alt="nx8up" width={56} height={56} priority />
          </Link>
          <div className="home-topbar-right">
            {role && (
              <span
                className="home-role-pill"
                style={{
                  color: roleColor,
                  borderColor: `${roleColor}33`,
                  background: `${roleColor}11`,
                }}
              >
                {role}
              </span>
            )}
          <SignOutButton>
            <button type="button" className="home-sign-out">Sign out</button>
          </SignOutButton>          
        </div>
        </div>

        <div className="home-body">
          <div className="home-greeting">Welcome back, {username}</div>

          <h1 className="home-title">
            Your <span>Hub</span>
          </h1>
          <p className="home-subtitle">
            Access your dashboard, manage your campaigns, and track your progress — all in one place.
          </p>

          {/* Primary dashboard CTA */}
          {dashboardLink && (
            <div className="home-cta">
              <Link href={dashboardLink} className="home-dashboard-btn">
                <span className="home-btn-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="#00c8ff" strokeWidth="1.2"/>
                    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="#00c8ff" strokeWidth="1.2"/>
                    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="#00c8ff" strokeWidth="1.2"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="#00c8ff" strokeWidth="1.2"/>
                  </svg>
                </span>
                Go to {dashboardLabel}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <span className="home-btn-label">Your primary workspace</span>
            </div>
          )}

          {/* Quick links based on role */}
          <div className="home-section-label">Quick Access</div>

          <div className="home-grid">
            {/* Creator links */}
            {(role === 'creator' || role === 'admin') && (
              <>
                <HomeQuickAccessCard
                  href="/creator/academy"
                  title="Academy"
                  description="Continue your lessons and earn XP"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2L16 6v6l-7 4-7-4V6l7-4z" stroke="#00c8ff" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M9 2v10M2 6l7 4 7-4" stroke="#00c8ff" strokeWidth="1.2"/>
                    </svg>
                  }
                />
                <HomeQuickAccessCard
                  href="/creator/profile"
                  title="Profile"
                  description="Manage your creator profile and media kit"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="6" r="3" stroke="#00c8ff" strokeWidth="1.2"/>
                      <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#00c8ff" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  }
                />
              </>
            )}

            {/* Sponsor links */}
            {(role === 'sponsor' || role === 'admin') && (
              <>
                <HomeQuickAccessCard
                  href="/sponsor/campaigns"
                  title="My Campaigns"
                  description="View and manage your active campaigns"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5L9 2z" stroke="#7b4fff" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                  }
                />
                <HomeQuickAccessCard
                  href="/sponsor/creators"
                  title="Browse Creators"
                  description="Find and connect with creators"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="6" cy="6" r="2.5" stroke="#7b4fff" strokeWidth="1.2"/>
                      <circle cx="12" cy="6" r="2.5" stroke="#7b4fff" strokeWidth="1.2"/>
                      <path d="M1 15c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="#7b4fff" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M12 11c1.5 0 4 .8 4 4" stroke="#7b4fff" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  }
                />
              </>
            )}

            {/* Admin links */}
            {role === 'admin' && (
              <>
                <HomeQuickAccessCard
                  href="/admin/creators"
                  title="Manage Creators"
                  description="View and manage all creator accounts"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="6" r="3" stroke="#ff6b8a" strokeWidth="1.2"/>
                      <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  }
                />
                <HomeQuickAccessCard
                  href="/admin/reports"
                  title="Reports"
                  description="Platform analytics and insights"
                  icon={
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="2" y="2" width="14" height="14" rx="2" stroke="#ff6b8a" strokeWidth="1.2"/>
                      <path d="M5 12l3-4 3 2 3-5" stroke="#ff6b8a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                />
              </>
            )}

            {/* Shared for all roles */}
            <HomeQuickAccessCard
              href="/onboarding"
              title="Settings"
              description="Update your account and preferences"
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="#3a5570" strokeWidth="1.2"/>
                  <path d="M9 6v4M9 12v.5" stroke="#3a5570" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </>
  )
}