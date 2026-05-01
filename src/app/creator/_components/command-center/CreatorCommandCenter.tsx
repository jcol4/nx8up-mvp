'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Megaphone,
  Play,
  Plus,
  PlusCircle,
  Trash2,
  User,
} from 'lucide-react'
import RoleLayoutShell from '@/components/nx-shell/RoleLayoutShell'
import { type SidebarNavGroup, type SidebarNavItem } from '@/components/nx-shell/RoleSidebar'
import NxHudHeader from '@/components/nx-shell/NxHudHeader'
import {
  addCreatorXp,
  addCreatorDayTask,
  deleteCreatorDayTask,
  toggleCreatorDayTask,
  updateCreatorDayTask,
  type CalendarTasksMap,
} from '../../_actions'

type Application = {
  id: string
  status: string
  submitted_at: Date | string | null
  campaign: {
    id: string
    title: string
    budget: number | null
    start_date: Date | string | null
    end_date: Date | string | null
    sponsor: { company_name: string | null }
  }
}

type Props = {
  displayName: string
  level: number
  rankName: string
  xp: number
  xpForNext: number
  applications: Application[]
  openCampaigns: {
    id: string
    title: string
    budget: number | null
    end_date: Date | string | null
    sponsor: { company_name: string | null }
  }[]
  creatorStats: {
    twitchFollowers: number | null
    averageVodViews: number | null
    twitchUsername: string | null
    youtubeChannelName: string | null
  }
  statsUnavailable?: boolean
  isAdmin?: boolean
  calendarTasks: CalendarTasksMap
}

type CalendarView = 'month' | 'week'
type CampaignTab = 'active' | 'open' | 'pending' | 'payout'
type CalendarEvent = {
  label: string
  color: 'primary' | 'secondary' | 'neutral'
  strong?: boolean
  past?: boolean
}
type CalendarGridCell = {
  date: Date
  day: number
  muted?: boolean
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy
}

function buildMonthCells(viewDate: Date): CalendarGridCell[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startDay = firstOfMonth.getDay()
  const mondayOffset = startDay === 0 ? 6 : startDay - 1
  const gridStart = new Date(year, month, 1 - mondayOffset)
  const cells: CalendarGridCell[] = []

  for (let i = 0; i < 35; i++) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    cells.push({
      date,
      day: date.getDate(),
      muted: date.getMonth() !== month,
    })
  }

  return cells
}

function buildWeekCells(anchorDate: Date): CalendarGridCell[] {
  const start = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return { date, day: date.getDate(), muted: false }
  })
}

function withSameDayInMonth(baseDate: Date, targetYear: number, targetMonth: number): Date {
  const targetMonthLastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const day = Math.min(baseDate.getDate(), targetMonthLastDay)
  return new Date(targetYear, targetMonth, day)
}

const calendarDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function buildCampaignEventMap(applications: Application[]): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const add = (dateVal: Date | string | null, event: CalendarEvent) => {
    if (!dateVal) return
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const past = d < today
    map[key] = [...(map[key] ?? []), { ...event, past }]
  }
  for (const app of applications) {
    if (app.status !== 'accepted' && app.status !== 'pending') continue
    const color: CalendarEvent['color'] = app.status === 'accepted' ? 'primary' : 'secondary'
    const title = app.campaign.title.toUpperCase()
    add(app.campaign.start_date, { label: `${title} START`, color })
    add(app.campaign.end_date, { label: `${title} END`, color, strong: true })
  }
  return map
}

const MISSIONS = [
  { id: 'sync-content-queue', title: 'SYNC CONTENT QUEUE', xp: 250, progress: 0.8 },
  { id: 'engage-top-comments', title: 'ENGAGE TOP 10 COMMENTS', xp: 150, progress: 0.33 },
  { id: 'optimize-profile-seo', title: 'OPTIMIZE PROFILE SEO', xp: 400, progress: 0 },
]

function isHubActive(pathname: string, href: string): boolean {
  if (href === '/creator') return pathname === '/creator'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function CreatorCommandCenter({
  displayName,
  level,
  rankName,
  xp,
  xpForNext,
  applications,
  openCampaigns,
  creatorStats,
  statsUnavailable = false,
  isAdmin = false,
  calendarTasks,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [campaignTab, setCampaignTab] = useState<CampaignTab>('open')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [viewDate, setViewDate] = useState(() => new Date())
  const [noteDraft, setNoteDraft] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null)

  const accepted = applications.filter((a) => a.status === 'accepted').slice(0, 3)
  const open = openCampaigns.slice(0, 3)
  const payoutCandidates = applications.filter((a) =>
    ['payout_due', 'paid', 'completed', 'approved'].includes(a.status)
  )
  const nonOpenCampaignItems: Application[] =
    campaignTab === 'active'
      ? accepted
      : campaignTab === 'pending'
        ? applications.filter((a) => a.status === 'pending')
        : payoutCandidates
  const tabLabel =
    campaignTab === 'active'
      ? 'active campaigns'
      : campaignTab === 'open'
        ? 'open campaigns'
        : campaignTab === 'pending'
          ? 'pending campaigns'
          : 'campaigns with payout due'
  const tabDescription =
    campaignTab === 'open'
      ? 'Campaigns currently open for applications.'
      : campaignTab === 'active'
        ? 'Campaigns where your application has been accepted.'
        : campaignTab === 'pending'
          ? 'Campaigns awaiting an acceptance or rejection decision.'
          : 'Campaigns with payouts that are due or in progress.'
  const displayedCampaigns: Array<{
    id: string
    campaignId: string
    title: string
    sponsorName: string
    budget: number | null
    endDate: Date | string | null
  }> = campaignTab === 'open'
    ? open.map((campaign) => ({
      id: campaign.id,
      campaignId: campaign.id,
      title: campaign.title,
      sponsorName: campaign.sponsor.company_name ?? 'Sponsor',
      budget: campaign.budget,
      endDate: campaign.end_date,
    }))
    : nonOpenCampaignItems.map((app) => ({
      id: app.id,
      campaignId: app.campaign.id,
      title: app.campaign.title,
      sponsorName: app.campaign.sponsor.company_name ?? 'Sponsor',
      budget: app.campaign.budget,
      endDate: app.campaign.end_date,
    }))
  const progress = xpForNext > 0 ? Math.min(100, Math.round((xp / xpForNext) * 100)) : 0
  const userName = displayName || 'Creator'
  const collapsedNavItems: SidebarNavItem[] = [
    { href: '/creator', label: 'Dashboard', icon: 'dashboard', exact: true },
    { href: '/creator/profile', label: 'Profile', icon: 'profile' },
    { href: '/creator/campaigns', label: 'Campaigns', icon: 'campaigns' },
    { href: '/creator/deal-room', label: 'Deal Room', icon: 'dealRoom' },
    { href: '/creator/academy', label: 'Academy', icon: 'academy' },
    { href: '/creator/steam-lookup', label: 'Steam Lookup', icon: 'creators' },
    { href: '/creator/settings/notifications', label: 'Notifications', icon: 'notifications' },
  ]
  const navGroups: SidebarNavGroup[] = [
    ...(isAdmin
      ? [
        {
          title: 'Sections',
          items: [
            { href: '/admin', label: 'Admin', icon: 'verification' },
            { href: '/creator', label: 'Creator', icon: 'creators', exact: true },
            { href: '/sponsor', label: 'Sponsor', icon: 'payouts' },
          ],
        } as SidebarNavGroup,
      ]
      : []),
    {
      title: 'Creator',
      items: [
        { href: '/creator', label: 'Dashboard', icon: 'dashboard', exact: true },
        { href: '/creator/profile', label: 'Profile', icon: 'profile' },
        { href: '/creator/campaigns', label: 'Campaigns', icon: 'campaigns' },
        { href: '/creator/deal-room', label: 'Deal Room', icon: 'dealRoom' },
        { href: '/creator/academy', label: 'Academy', icon: 'academy' },
        { href: '/creator/steam-lookup', label: 'Steam Lookup', icon: 'creators' },
      ],
    },
    {
      title: 'Notifications',
      borderTop: true,
      items: [
        { href: '/creator/settings/notifications', label: 'Preferences', icon: 'notifications' },
      ],
    },
  ]
  const adminCollapsedItems: SidebarNavItem[] = isAdmin
    ? [
      { href: '/admin', label: 'Admin', icon: 'verification' },
      { href: '/creator', label: 'Creator', icon: 'creators', exact: true },
      { href: '/sponsor', label: 'Sponsor', icon: 'payouts' },
    ]
    : []
  const statsRows = [
    {
      label: 'Twitch Followers',
      value: creatorStats.twitchFollowers != null ? creatorStats.twitchFollowers.toLocaleString() : '—',
    },
    {
      label: 'Avg VOD views',
      value: creatorStats.averageVodViews != null ? creatorStats.averageVodViews.toLocaleString() : '—',
    },
    {
      label: 'Twitch',
      value: creatorStats.twitchUsername ? `@${creatorStats.twitchUsername}` : 'Not linked',
      valueClassName: creatorStats.twitchUsername ? 'font-medium text-[#7b4fff]' : 'italic text-slate-500',
    },
    {
      label: 'YouTube',
      value: creatorStats.youtubeChannelName ? `@${creatorStats.youtubeChannelName}` : 'Not linked',
      valueClassName: creatorStats.youtubeChannelName ? 'font-medium text-[#ff4444]' : 'italic text-slate-500',
    },
  ]

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('[data-reveal]').forEach((item) => item.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px -8% 0px' }
    )
    const revealItems = document.querySelectorAll('[data-reveal]')
    revealItems.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  const selectedDateKey = toDateKey(selectedDate)
  const selectedDayNotes = calendarTasks[selectedDateKey] ?? []

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
  const weekStart = startOfWeek(selectedDate)
  const weekLabel = `WEEK OF ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`

  const handleClaim = async (missionId: string, amount: number) => {
    setClaimingMissionId(missionId)
    const result = await addCreatorXp(amount)
    setClaimingMissionId(null)
    if (result.error) return
    router.refresh()
  }

  const addNoteForSelectedDay = async () => {
    const trimmed = noteDraft.trim()
    if (!trimmed) return

    const result = await addCreatorDayTask(selectedDateKey, trimmed)
    if (result.error) return
    setNoteDraft('')
    router.refresh()
  }

  const removeNoteForSelectedDay = async (noteId: string) => {
    const result = await deleteCreatorDayTask(selectedDateKey, noteId)
    if (result.error) return
    router.refresh()
  }

  const toggleNoteDone = async (noteId: string) => {
    const result = await toggleCreatorDayTask(selectedDateKey, noteId)
    if (result.error) return
    router.refresh()
  }

  const startEditNote = (noteId: string, text: string) => {
    setEditingNoteId(noteId)
    setEditingNoteText(text)
  }

  const cancelEditNote = () => {
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  const saveEditNote = async () => {
    if (!editingNoteId) return
    const trimmed = editingNoteText.trim()
    if (!trimmed) return
    const result = await updateCreatorDayTask(selectedDateKey, editingNoteId, { text: trimmed })
    if (result.error) return
    cancelEditNote()
    router.refresh()
  }

  const getTaskCountForDate = (date: Date, muted?: boolean): number => {
    if (muted) return 0
    return calendarTasks[toDateKey(date)]?.length ?? 0
  }

  const campaignEventMap = useMemo(() => buildCampaignEventMap(applications), [applications])
  const selectedDayEvents = (campaignEventMap[toDateKey(selectedDate)] ?? []).length

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return campaignEventMap[toDateKey(date)] ?? []
  }

  const handlePrevPeriod = () => {
    if (calendarView === 'month') {
      setViewDate((prev) => {
        const targetYear = prev.getMonth() === 0 ? prev.getFullYear() - 1 : prev.getFullYear()
        const targetMonth = prev.getMonth() === 0 ? 11 : prev.getMonth() - 1
        const nextSelected = withSameDayInMonth(selectedDate, targetYear, targetMonth)
        setSelectedDate(nextSelected)
        return new Date(targetYear, targetMonth, 1)
      })
      return
    }
    setSelectedDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  }

  const handleNextPeriod = () => {
    if (calendarView === 'month') {
      setViewDate((prev) => {
        const targetYear = prev.getMonth() === 11 ? prev.getFullYear() + 1 : prev.getFullYear()
        const targetMonth = prev.getMonth() === 11 ? 0 : prev.getMonth() + 1
        const nextSelected = withSameDayInMonth(selectedDate, targetYear, targetMonth)
        setSelectedDate(nextSelected)
        return new Date(targetYear, targetMonth, 1)
      })
      return
    }
    setSelectedDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })
  }

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    if (calendarView === 'month') {
      setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-foreground selection:bg-[#99f7ff]/30">
      <RoleLayoutShell
        homeHref="/creator"
        navGroups={navGroups}
        collapsedNavItems={[...adminCollapsedItems, ...collapsedNavItems]}
        statsTitle="My Stats"
        statsRows={statsRows}
        statsUnavailable={statsUnavailable}
        animateContentOffset={false}
      >
        {(collapsed) => (
          <>
            <NxHudHeader
              mode="fixedWithSidebar"
              collapsed={collapsed}
              displayName={displayName}
              username={null}
              role={isAdmin ? 'admin' : 'creator'}
              profileHref="/creator/profile"
            />

            <main className="space-y-6 p-6 pt-24">
              <div data-reveal className="reveal-item grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-5 neon-glow-teal">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="mr-4 flex min-w-0 flex-1 items-center gap-3">
                      <h2 className="shrink-0 font-headline text-base tracking-[0.24em] text-[#99f7ff] font-semibold">TODAY&apos;S MISSIONS</h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#99f7ff]/55 to-transparent" />
                    </div>
                    <span className="text-[10px] text-[#a9abb5]">{MISSIONS.length} ACTIVE</span>
                  </div>
                  <div className="space-y-4">
                    {MISSIONS.map((mission) => (
                      <div key={mission.id} className="space-y-2 transition-transform duration-200 hover:translate-x-1">
                        <div className="flex items-center justify-between gap-3 text-[10px]">
                          <div className="min-w-0">
                            <p>{mission.title}</p>
                            <p className="text-[#99f7ff]">{mission.xp} XP</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClaim(mission.id, mission.xp)}
                            disabled={claimingMissionId === mission.id}
                            className="shrink-0 rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-1 text-[9px] uppercase tracking-widest text-[#99f7ff] transition hover:bg-[#99f7ff]/20 disabled:opacity-60"
                          >
                            {claimingMissionId === mission.id ? '...' : 'Complete'}
                          </button>
                        </div>
                        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-[#a855f7]" style={{ width: `${Math.round(mission.progress * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400">LEVEL {level}</p>
                        <p className="font-headline text-sm font-bold tracking-widest">{rankName.toUpperCase()}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{xp.toLocaleString()} / {xpForNext.toLocaleString()} XP</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#99f7ff]/30 text-[10px] font-bold text-[#99f7ff]">
                        {progress}%
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full bg-gradient-to-r from-[#86ef4a] to-[#22c55e]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </section>

                <section className="glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-5 lg:col-span-2 neon-glow-teal">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="mr-4 flex min-w-0 flex-1 items-center gap-3">
                      <h2 className="shrink-0 font-headline text-base tracking-[0.24em] text-[#99f7ff] font-semibold">CAMPAIGNS</h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#99f7ff]/45 to-transparent" />
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCampaignTab('open')}
                      className={`h-9 rounded-lg px-3 text-[10px] uppercase tracking-widest transition ${campaignTab === 'open'
                        ? 'border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[#99f7ff]'
                        : 'border border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignTab('active')}
                      className={`h-9 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest transition ${campaignTab === 'active'
                        ? 'border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[#99f7ff]'
                        : 'border border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignTab('pending')}
                      className={`h-9 rounded-lg px-3 text-[10px] uppercase tracking-widest transition ${campaignTab === 'pending'
                        ? 'border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[#99f7ff]'
                        : 'border border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignTab('payout')}
                      className={`h-9 rounded-lg px-3 text-[10px] uppercase tracking-widest transition ${campaignTab === 'payout'
                        ? 'border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[#99f7ff]'
                        : 'border border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      Payout due
                    </button>
                  </div>
                  <p className="mb-4 text-xs text-[#a9abb5]">{tabDescription}</p>

                  {displayedCampaigns.length === 0 ? (
                    <div className="flex min-h-56 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-center">
                      <div className="space-y-2">
                        <p className="text-base font-medium text-slate-400">No {tabLabel} yet.</p>
                        <Link href="/creator/campaigns" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
                          View available campaigns
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedCampaigns.map((app) => (
                        <Link
                          key={app.id}
                          href={`/creator/campaigns/${app.campaignId}`}
                          className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:border-[#99f7ff]/35 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-100">{app.title}</p>
                              <p className="text-xs text-slate-400">{app.sponsorName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#99f7ff]">
                                {app.budget != null
                                  ? `$${app.budget.toLocaleString()}`
                                  : '—'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {app.endDate
                                  ? new Date(app.endDate).toLocaleDateString()
                                  : 'No due date'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href={
                      campaignTab === 'active'
                        ? '/creator/campaigns/active'
                        : campaignTab === 'pending'
                          ? '/creator/campaigns/pending'
                          : '/creator/campaigns'
                    }
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#99f7ff]/20 bg-transparent text-sm font-medium text-slate-500 transition hover:bg-[#99f7ff]/5 hover:text-slate-300"
                  >
                    View all campaigns
                  </Link>
                </section>
              </div>

              <section data-reveal className="reveal-item glass-panel calendar-perf-panel interactive-panel relative overflow-hidden rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-6 neon-glow-purple [contain:layout_paint_style]">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-[#99f7ff]/5 blur-2xl opacity-70" />
                <div className={`${calendarView === 'month' ? 'mb-6' : 'mb-8'} flex flex-col items-start justify-between gap-4 md:flex-row md:items-center`}>
                  <div className="w-full md:flex-1">
                    <div className="mb-1 flex w-full items-center gap-3">
                      <h2 className="shrink-0 font-headline text-2xl font-bold tracking-tight text-[#99f7ff]">CALENDAR</h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#99f7ff]/40 to-transparent" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarView('month')
                        setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
                      }}
                      className={`rounded border px-3 py-1 text-[10px] tracking-widest transition-colors ${calendarView === 'month' ? 'border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[#99f7ff]' : 'border-white/10 text-slate-400 hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/10 hover:text-[#99f7ff]'}`}
                    >
                      MONTH
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarView('week')}
                      className={`rounded border px-3 py-1 text-[10px] tracking-widest transition-colors ${calendarView === 'week' ? 'border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[#99f7ff]' : 'border-white/10 text-slate-400 hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/10 hover:text-[#99f7ff]'}`}
                    >
                      WEEK
                    </button>
                    <div className="mx-1 h-4 w-px bg-white/10" />
                    <button
                      type="button"
                      onClick={handlePrevPeriod}
                      className="rounded border border-white/10 p-1 text-slate-300 hover:text-[#99f7ff] hover:border-[#99f7ff]/35 transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="mx-1 text-[10px] font-bold tracking-widest">
                      {calendarView === 'month' ? monthLabel : weekLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPeriod}
                      className="rounded border border-white/10 p-1 text-slate-300 hover:text-[#99f7ff] hover:border-[#99f7ff]/35 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div>
                    <CalendarGrid
                      view={calendarView}
                      selectedDate={selectedDate}
                      viewDate={viewDate}
                      getTaskCountForDate={getTaskCountForDate}
                      getEventsForDate={getEventsForDate}
                      onSelectDate={handleSelectDate}
                    />
                  </div>
                  <aside className="space-y-3">
                    <div className="rounded-lg border border-[#99f7ff]/30 bg-black/30 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-headline text-2xl font-bold tracking-wide text-[#99f7ff]">
                            {calendarView === 'month'
                              ? `${selectedDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}_${String(selectedDate.getDate()).padStart(2, '0')}_${selectedDate.getFullYear()}`
                              : `DAY_${String(selectedDate.getDate()).padStart(2, '0')}`}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#a9abb5]">DAY_DETAIL_LOG</p>
                        </div>
                        <Calendar className="h-4 w-4 text-[#99f7ff]" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-sm border border-[#d873ff]/40 bg-[#d873ff]/10 px-2 py-1 text-[9px] uppercase tracking-widest text-[#d873ff]">
                          {selectedDayNotes.length} Notes
                        </span>
                        {selectedDayEvents > 0 && (
                          <span className="rounded-sm border border-[#99f7ff]/40 bg-[#99f7ff]/10 px-2 py-1 text-[9px] uppercase tracking-widest text-[#99f7ff]">
                            {selectedDayEvents} Campaign Event{selectedDayEvents !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#a9abb5]">Add Task</p>
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault()
                            void addNoteForSelectedDay()
                          }
                        }}
                        placeholder="What needs to get done?"
                        className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-[#99f7ff]/35 focus:ring-2 focus:ring-[#99f7ff]/15"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={addNoteForSelectedDay}
                          className="inline-flex h-8 items-center rounded-md border border-[#99f7ff]/35 bg-[#99f7ff]/15 px-3 text-[10px] uppercase tracking-widest text-[#99f7ff] transition hover:bg-[#99f7ff]/25"
                        >
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                          Add Note
                        </button>
                      </div>
                    </div>

                    <div className="calendar-notes-scroll max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/70 p-2 pr-1">
                      {getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.label}
                          className={`rounded-lg border-l-2 p-3 text-[11px] font-semibold uppercase tracking-widest ${
                            event.past
                              ? 'border-white/15 bg-white/[0.03] text-slate-600 line-through'
                              : event.color === 'primary'
                                ? 'border-[#99f7ff] bg-[#99f7ff]/10 text-[#99f7ff]'
                                : 'border-[#d873ff] bg-[#d873ff]/10 text-[#d873ff]'
                          }`}
                        >
                          {event.label}
                        </div>
                      ))}
                      {selectedDayNotes.length > 0 ? (
                        selectedDayNotes.map((note, index) => (
                          <div key={note.id} className="group rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[9px] uppercase tracking-[0.16em] text-[#a9abb5]">{`TASK_${String(index + 1).padStart(2, '0')}`}</p>
                              <button
                                type="button"
                                onClick={() => removeNoteForSelectedDay(note.id)}
                                className="rounded p-1 text-slate-500 opacity-0 transition hover:bg-white/5 hover:text-[#d873ff] group-hover:opacity-100 focus-visible:opacity-100"
                                aria-label="Delete note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleNoteDone(note.id)}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${note.done
                                  ? 'border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]'
                                  : 'border-white/20 text-transparent hover:border-[#99f7ff]/50'
                                  }`}
                                aria-label={note.done ? 'Mark note as open' : 'Mark note as done'}
                              >
                                <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current">
                                  <path d="M7.5 13.3L4.2 10l-1.4 1.4 4.7 4.7L17.2 6.4 15.8 5z" />
                                </svg>
                              </button>
                              <div className="flex-1">
                                {editingNoteId === note.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editingNoteText}
                                      onChange={(event) => setEditingNoteText(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                          event.preventDefault()
                                          void saveEditNote()
                                        } else if (event.key === 'Escape') {
                                          cancelEditNote()
                                        }
                                      }}
                                      className="min-h-16 w-full resize-none rounded border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-[#99f7ff]/40"
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={cancelEditNote}
                                        className="rounded border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-400 hover:bg-white/5"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={saveEditNote}
                                        className="rounded border border-[#99f7ff]/35 bg-[#99f7ff]/15 px-2 py-1 text-[10px] uppercase tracking-widest text-[#99f7ff] hover:bg-[#99f7ff]/25"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startEditNote(note.id, note.text)}
                                    className={`w-full text-left text-sm leading-relaxed transition ${note.done ? 'text-slate-500 line-through' : 'text-slate-300 hover:text-white'
                                      }`}
                                  >
                                    {note.text}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : selectedDayEvents === 0 ? (
                        <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-3">
                          <p className="text-xs text-slate-500">No log entries for this day yet.</p>
                        </div>
                      ) : null}
                    </div>
                  </aside>
                </div>
              </section>

              <section data-reveal className="reveal-item glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-5 neon-glow-teal">
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="shrink-0 font-headline text-sm tracking-[0.22em] text-[#99f7ff] font-semibold">ACADEMY</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-[#99f7ff]/45 to-transparent" />
                  <Link href="/creator/academy" className="shrink-0 text-[10px] text-[#a9abb5] hover:text-[#99f7ff]">View all</Link>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/40">
                  <div className="relative mx-auto w-full max-w-[680px] aspect-[16/9]">
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src="https://www.youtube-nocookie.com/embed/K5qh58o5A-M?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0"
                      title="Mr. Fruit academy video preview"
                      allow="autoplay; encrypted-media"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex items-center justify-center rounded-full border border-white/15 bg-black/35 p-2 shadow-[0_0_24px_-12px_rgba(153,247,255,0.3)]">
                        <Play className="h-5 w-5 text-[#99f7ff]" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="font-headline text-lg font-bold">Mr. Fruit Feature Lesson</p>
                  <p className="text-[10px] text-slate-400">Gaming / Creator</p>
                  <p className="text-[10px] text-slate-400">0/12 min</p>
                </div>
                <Link
                  href="/creator/academy"
                  className="mt-4 inline-block h-12 w-full rounded-lg bg-[#99f7ff] text-black text-[14px] font-bold tracking-tight hover:brightness-110 transition text-center leading-[3rem]"
                >
                  Begin Module
                </Link>
              </section>
            </main>

            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around gap-0.5 border-t border-white/10 bg-slate-950/90 px-1 backdrop-blur-md md:hidden">
              <MobileItem href="/creator" icon={LayoutDashboard} label="Home" active={isHubActive(pathname, '/creator')} />
              <MobileItem href="/creator/campaigns" icon={Megaphone} label="Campaigns" active={isHubActive(pathname, '/creator/campaigns')} />
              <Link
                href="/creator/academy"
                className="-mt-8 shrink-0 rounded-full border-4 border-slate-950 bg-gradient-to-br from-[#99f7ff] to-cyan-300 p-3 shadow-lg shadow-[#99f7ff]/40 transition duration-200 active:scale-95"
                aria-label="Academy"
              >
                <Plus className="h-5 w-5 text-[#005f64]" />
              </Link>
              <MobileItem href="/creator/deal-room" icon={Handshake} label="Deals" active={isHubActive(pathname, '/creator/deal-room')} />
              <MobileItem
                href="/creator/settings/notifications"
                icon={Bell}
                label="Alerts"
                active={pathname.startsWith('/creator/settings')}
              />
              <MobileItem href="/creator/profile" icon={User} label="Profile" active={isHubActive(pathname, '/creator/profile')} />
            </nav>
          </>
        )}
      </RoleLayoutShell>
    </div>
  )
}

function MobileItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 transition duration-200 active:scale-95 ${active ? 'text-[#99f7ff]' : 'text-slate-400'}`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[8px] uppercase tracking-widest">{label}</span>
    </Link>
  )
}

function CalendarGrid({
  view,
  selectedDate,
  viewDate,
  getTaskCountForDate,
  getEventsForDate,
  onSelectDate,
}: {
  view: CalendarView
  selectedDate: Date
  viewDate: Date
  getTaskCountForDate: (date: Date, muted?: boolean) => number
  getEventsForDate: (date: Date) => CalendarEvent[]
  onSelectDate: (date: Date) => void
}) {
  const cells = view === 'month' ? buildMonthCells(viewDate) : buildWeekCells(selectedDate)
  const isWeek = view === 'week'
  const today = new Date()
  const isSelectedDate = (date: Date) =>
    selectedDate.getFullYear() === date.getFullYear() &&
    selectedDate.getMonth() === date.getMonth() &&
    selectedDate.getDate() === date.getDate()
  const isTodayDate = (date: Date) =>
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-white/5 bg-white/5 [contain:paint] isolate [transform:translateZ(0)]">
      {calendarDays.map((day) => (
        <div
          key={day}
          className={`bg-[#1b2029] text-center text-[8px] ${isWeek ? 'p-2' : 'flex min-h-10 items-center justify-center p-1.5'} ${day === 'SAT' || day === 'SUN' ? 'text-[#d873ff]' : 'text-slate-400'
            }`}
        >
          {day}
        </div>
      ))}
      {cells.map((cell, idx) => {
        const cellEvents = getEventsForDate(cell.date)
        return (
        <button
          key={`${view}-${toDateKey(cell.date)}-${idx}`}
          type="button"
          onClick={() => !cell.muted && onSelectDate(cell.date)}
          className={`${isWeek ? 'min-h-56 p-3' : 'min-h-24 p-2'} border-r border-b border-white/5 text-left transition-[background-color] duration-100 [will-change:background-color] bg-black/50 ${isSelectedDate(cell.date) && !cell.muted ? 'ring-1 ring-[#99f7ff]/35' : ''} ${isTodayDate(cell.date) && !cell.muted ? 'ring-1 ring-[#d873ff]/45 shadow-[inset_0_0_0_1px_rgba(216,115,255,0.2)]' : ''
            } ${cell.muted ? 'cursor-default' : 'hover:bg-white/[0.03]'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-[10px] ${cell.muted
                ? 'text-slate-700'
                : isTodayDate(cell.date)
                  ? 'font-headline font-bold text-[#d873ff]'
                  : 'text-slate-100'
                }`}
            >
              {cell.day}
            </p>
            {isTodayDate(cell.date) && !cell.muted ? (
              <span className="rounded-full border border-[#d873ff]/30 bg-[#d873ff]/10 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-[#d873ff]">
                Today
              </span>
            ) : null}
            {getTaskCountForDate(cell.date, cell.muted) > 0 ? (
              <span className="rounded-full border border-[#99f7ff]/20 bg-[#99f7ff]/10 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-[#99f7ff]">
                Note
              </span>
            ) : null}
          </div>
          {(isWeek ? cellEvents : cellEvents.slice(0, 1)).map((event) => (
            <EventTag
              key={`${toDateKey(cell.date)}-${event.label}`}
              color={event.color}
              strong={event.strong}
              past={event.past}
              label={event.label}
              compact={!isWeek}
            />
          ))}
          {isWeek && !cell.muted && getTaskCountForDate(cell.date, cell.muted) > 0 ? (
            <div className="mt-2 rounded border border-white/8 bg-white/[0.03] px-2 py-1 text-[9px] leading-relaxed text-slate-300">
              {`${getTaskCountForDate(cell.date, cell.muted)} task(s) scheduled`}
            </div>
          ) : null}
        </button>
        )
      })}
    </div>
  )
}

function EventTag({
  label,
  color,
  strong,
  compact,
  past,
}: {
  label: string
  color: CalendarEvent['color']
  strong?: boolean
  compact?: boolean
  past?: boolean
}) {
  const styles = past
    ? 'bg-white/[0.03] text-slate-600 border-white/15 line-through'
    : color === 'primary'
      ? 'bg-[#99f7ff]/20 text-[#99f7ff] border-[#99f7ff]'
      : color === 'secondary'
        ? 'bg-[#d873ff]/20 text-[#d873ff] border-[#d873ff]'
        : 'bg-white/5 text-slate-400 border-white/30'

  return (
    <div className={`${compact ? 'mt-1 p-1 text-[7.5px]' : 'mt-2 p-1.5 text-[8px]'} rounded border-l-2 leading-tight ${strong && !past ? 'font-bold' : ''} ${styles}`}>
      {label}
    </div>
  )
}
