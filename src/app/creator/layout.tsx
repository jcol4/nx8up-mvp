import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import { DashboardSidebar } from '@/components/dashboard'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Creator Dashboard | nx8up',
  description: 'Creator dashboard',
}

const ALL_SECTION_NAV_ITEMS = [
  { href: '/creator', label: 'Creator' },
  { href: '/sponsor', label: 'Sponsor' },
  { href: '/admin', label: 'Admin' },
]

const CREATOR_ONLY_SECTION_NAV_ITEMS = [
  { href: '/creator', label: 'Creator' },
]

const NAV_ITEMS = [
  { href: '/creator', label: 'Dashboard' },
  { href: '/creator/profile', label: 'Profile' },
  { href: '/creator/campaigns', label: 'Campaigns' },
  { href: '/creator/deal-room', label: 'Deal Room' },
  { href: '/creator/academy', label: 'Academy' },
  { href: '/creator/settings/notifications', label: 'Notifications' },
]

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) redirect('/sign-in')
  if (role !== 'creator' && role !== 'admin') redirect('/')

  const sectionNavItems =
    role === 'admin' ? ALL_SECTION_NAV_ITEMS : CREATOR_ONLY_SECTION_NAV_ITEMS

  // Fetch real creator stats from DB
  const creator = await prisma.content_creators.findUnique({
    where: { clerk_user_id: userId },
    select: {
      subs_followers: true,
      average_vod_views: true,
      twitch_username: true,
      youtube_channel_name: true,
      youtube_avg_views: true,
      youtube_subscribers: true,
      _count: { select: { applications: true } },
    },
  })

  const statsNode = (
    <div className="px-4 pt-3 pb-4">
      <p className="text-xs font-semibold dash-text-muted uppercase tracking-wider mb-3">
        My Stats
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Twitch Followers</span>
          <span className="dash-text-bright font-semibold">
            {creator?.subs_followers != null
              ? creator.subs_followers.toLocaleString()
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Avg VOD views</span>
          <span className="dash-text-bright font-semibold">
            {creator?.average_vod_views != null
              ? creator.average_vod_views.toLocaleString()
              : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">Twitch</span>
          {creator?.twitch_username ? (
            <span className="text-[#7b4fff] font-medium">
              @{creator.twitch_username}
            </span>
          ) : (
            <span className="dash-text-muted italic text-xs">Not linked</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="dash-text-muted">YouTube</span>
          {creator?.youtube_channel_name ? (
            <span className="text-[#ff4444] font-medium">
              @{creator.youtube_channel_name}
            </span>
          ) : (
            <span className="dash-text-muted italic text-xs">Not linked</span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <DashboardStyles />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap');
        .cr-root {
          min-height: 100vh;
          background-color: #060d18;
          background-image:
            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,200,255,0.04) 0%, transparent 60%);
          font-family: 'Exo 2', sans-serif;
          color: #c8dff0;
        }
        .cr-root::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        .cr-topbar {
          height: 56px;
          background: rgba(6,13,24,0.95);
          border-bottom: 1px solid rgba(0,200,255,0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem 0 2rem;
          position: sticky;
          top: 0;
          z-index: 10;
          overflow: visible;
        }
        .cr-panel {
          background: rgba(10,18,35,0.8);
          border: 1px solid rgba(0,200,255,0.12);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cr-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00c8ff, #7b4fff);
          opacity: 0.5;
        }
        .cr-panel-title { font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #c8dff0; margin-bottom: 1rem; }
        .cr-text-muted { color: #4a6080; }
        .cr-text { color: #c8dff0; }
        .cr-text-bright { color: #e8f4ff; }
        .cr-accent { color: #00c8ff; }
        .cr-purple { color: #7b4fff; }
        .cr-success { color: #22c55e; }
        .cr-border { border-color: rgba(0,200,255,0.12); }
        .cr-bg-inner { background: rgba(0,0,0,0.2); }
      `}</style>
      <div className="dash-root cr-root">
        <div className="relative z-10 flex min-h-screen">
          <DashboardSidebar
            logoHref="/creator"
            sectionNavItems={sectionNavItems}
            sectionTitle="Creator"
            navItems={NAV_ITEMS}
            statsNode={statsNode}
          />
          <main className="flex-1 flex flex-col min-w-0">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
