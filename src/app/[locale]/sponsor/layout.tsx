import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Inter, Space_Grotesk } from 'next/font/google'
import DashboardStyles from '@/components/dashboard/DashboardStyles'
import RoleLayoutShell from '@/components/nx-shell/RoleLayoutShell'
import NxHudBackground from '@/components/nx-shell/NxHudBackground'
import type { SidebarNavGroup, SidebarNavItem } from '@/components/nx-shell/RoleSidebar'
import { prisma } from '@/lib/prisma'
import { getFormatter, getTranslations } from 'next-intl/server'
import { getSponsorKpiCached } from '@/lib/sponsor-dashboard-cache'

export const metadata: Metadata = {
  title: 'Sponsor Hub | Nx8up',
  description: 'Post campaigns and reach creators',
}

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-headline',
  subsets: ['latin'],
})

export default async function SponsorLayout({
  children,
}: { children: React.ReactNode }) {
  const { sessionClaims, userId } = await auth()
  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (!userId) redirect('/sign-in')
  if (role !== 'sponsor' && role !== 'admin') redirect('/')

  const sponsor = await prisma.sponsors.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  const kpi = sponsor ? await getSponsorKpiCached(sponsor.id) : null
  const format = await getFormatter()
  const t = await getTranslations('nav')
  const roleSwitchItems: SidebarNavItem[] = [
    { href: '/admin', label: t('roleAdmin'), icon: 'verification' },
    { href: '/creator', label: t('roleCreator'), icon: 'creators' },
    { href: '/sponsor', label: t('roleSponsor'), icon: 'payouts', exact: true },
  ]
  const adminSectionGroup: SidebarNavGroup[] =
    role === 'admin'
      ? [
        {
          title: t('sections'),
          items: roleSwitchItems,
        },
      ]
      : []
  const navGroups: SidebarNavGroup[] = [
    ...adminSectionGroup,
    {
      title: t('roleSponsor'),
      items: [
        { href: '/sponsor', label: t('dashboard'), icon: 'dashboard', exact: true },
        { href: '/sponsor/profile', label: t('profile'), icon: 'profile' },
        { href: '/sponsor/campaigns', label: t('myCampaigns'), icon: 'campaigns' },
        { href: '/sponsor/deal-room', label: t('dealRoom'), icon: 'dealRoom' },
        { href: '/sponsor/creators', label: t('creators'), icon: 'creators' },
        { href: '/sponsor/steam-lookup', label: t('steamLookup'), icon: 'creators' },
        { href: '/sponsor/payouts', label: t('payouts'), icon: 'payouts' },
        { href: '/sponsor/guide', label: t('guide'), icon: 'reports' },
      ] as SidebarNavItem[],
    },
    {
      title: t('notifications'),
      borderTop: true,
      items: [
        { href: '/sponsor/settings/notifications', label: t('preferences'), icon: 'notifications' },
      ] as SidebarNavItem[],
    },
  ]
  const collapsedNavItems: SidebarNavItem[] = [
    ...(role === 'admin' ? roleSwitchItems : []),
    { href: '/sponsor', label: t('dashboard'), icon: 'dashboard', exact: true },
    { href: '/sponsor/profile', label: t('profile'), icon: 'profile' },
    { href: '/sponsor/campaigns', label: t('campaigns'), icon: 'campaigns' },
    { href: '/sponsor/deal-room', label: t('deals'), icon: 'dealRoom' },
    { href: '/sponsor/creators', label: t('creators'), icon: 'creators' },
    { href: '/sponsor/settings/notifications', label: t('alerts'), icon: 'notifications' },
  ]
  const statsRows = kpi
    ? [
      {
        label: t('liveCampaigns'),
        value: kpi.liveCampaigns.toString(),
        valueClassName: 'font-bold text-[#00c8ff]',
      },
      {
        label: t('liveBudget'),
        value: kpi.liveBudget > 0 ? `$${format.number(kpi.liveBudget)}` : '—',
        valueClassName: 'font-bold text-[#00e5a0]',
      },
      {
        label: t('creatorsAccepted'),
        value: kpi.acceptedApps.toString(),
        valueClassName: 'font-bold text-[#c084fc]',
      },
    ]
    : [
      { label: t('liveCampaigns'), value: '0', valueClassName: 'font-bold text-[#00c8ff]' },
      { label: t('liveBudget'), value: '—', valueClassName: 'font-bold text-[#00e5a0]' },
      { label: t('creatorsAccepted'), value: '0', valueClassName: 'font-bold text-[#c084fc]' },
    ]

  return (
    <>
      <DashboardStyles />
      <div className={`creator-hud dash-root relative isolate ${inter.variable} ${spaceGrotesk.variable}`}>
        <NxHudBackground />
        <RoleLayoutShell
          homeHref="/sponsor"
          navGroups={navGroups}
          collapsedNavItems={collapsedNavItems}
          statsTitle={t('campaignStats')}
          statsRows={statsRows}
          animateContentOffset={false}
        >
          {children}
        </RoleLayoutShell>
      </div>
    </>
  )
}
