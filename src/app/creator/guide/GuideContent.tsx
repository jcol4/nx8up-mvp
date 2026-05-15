'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = { title: string; body: string }
type Section = { id: string; label: string; title: string; intro: string; steps: Step[] }

const SECTIONS: Section[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Welcome to nx8up',
    intro:
      'nx8up is a creator-first platform connecting gaming content creators with sponsors. As a creator, you apply to sponsored campaigns, negotiate deals, complete deliverables, and get paid — all in one place.',
    steps: [
      {
        title: 'How it works',
        body: 'Sponsors post campaigns with budgets and requirements. You browse open campaigns, submit applications, and if accepted, enter the Deal Room to finalize terms. Once you complete your deliverables, your payout is processed through Stripe.',
      },
      {
        title: 'Your dashboard',
        body: 'The dashboard is your command center. It shows your active missions, campaign pipeline, a calendar for scheduling deliverables, and a featured Academy lesson. Everything you need is one click away from the sidebar.',
      },
      {
        title: 'Reputation & XP',
        body: 'You earn XP by completing missions and campaigns. XP levels you up through ranks, which increases your visibility to sponsors and unlocks higher-value campaign opportunities.',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile & Platforms',
    title: 'Setting Up Your Profile',
    intro:
      'A complete profile is your pitch to sponsors. It tells them who you are, what platforms you create on, and what kind of content you make. Profiles with connected platforms rank higher in sponsor searches.',
    steps: [
      {
        title: 'Fill out your profile',
        body: 'Go to Profile in the sidebar. Add your bio, select your content categories, and set your primary platform. A complete bio helps sponsors understand your brand and decide if you fit their campaign.',
      },
      {
        title: 'Connect Twitch',
        body: 'From your Profile page, click "Connect Twitch." You will be redirected to Twitch to authorize nx8up. Once connected, your follower count and average VOD views sync automatically. This data is shown to sponsors when they review your application.',
      },
      {
        title: 'Connect YouTube',
        body: 'Click "Connect YouTube" on the Profile page to authorize access. Your subscriber count and channel name will appear in your profile. Keep your platforms connected — sponsors filter by platform and require up-to-date stats.',
      },
      {
        title: 'Connect Steam',
        body: 'If your content is gaming-focused, use Steam Lookup in the sidebar to verify a Steam account. This shows sponsors your gaming history and adds credibility to game-specific campaign applications.',
      },
    ],
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    title: 'Finding & Applying to Campaigns',
    intro:
      'Campaigns are the core of nx8up. Sponsors post campaigns with specific requirements, budgets, and timelines. You browse them, apply to the ones that fit your channel, and wait for a decision.',
    steps: [
      {
        title: 'Browse open campaigns',
        body: 'Click "Campaigns" in the sidebar to see all live campaigns. Each card shows the sponsor, budget, platform requirements, and content type. Read the full campaign details before applying — sponsors can see how thoroughly you read their brief.',
      },
      {
        title: 'Apply to a campaign',
        body: 'Open a campaign and click "Apply." Your profile stats are submitted automatically. Some campaigns may ask additional questions. After submitting, your application status shows as "Pending" on your dashboard.',
      },
      {
        title: 'Application statuses',
        body: 'Pending: your application is under review. Accepted: the sponsor wants to work with you — check the Deal Room. Rejected: the sponsor passed this time. You can apply to other campaigns immediately. Payout due: your campaign deliverables are complete and payment is being processed.',
      },
      {
        title: 'Direct invites',
        body: 'Sponsors can send you direct campaign invites. These appear in your Campaigns tab separately and do not require you to browse for them. Direct invites typically mean the sponsor specifically selected you based on your profile.',
      },
    ],
  },
  {
    id: 'deal-room',
    label: 'Deal Room',
    title: 'Negotiating in the Deal Room',
    intro:
      'The Deal Room is where accepted applications become real deals. You and the sponsor exchange messages, agree on deliverable specifics, and finalize terms before the campaign starts.',
    steps: [
      {
        title: 'Accessing the Deal Room',
        body: 'Once a sponsor accepts your application, click "Deal Room" in the sidebar. You will see a conversation thread for each accepted campaign. The deal is not active until both parties agree to the final terms.',
      },
      {
        title: 'Negotiating terms',
        body: 'Use the Deal Room to clarify content requirements, deliverable formats, posting schedules, and any budget adjustments. Keep communication professional — sponsors review your responsiveness when deciding on future invites.',
      },
      {
        title: 'Finalizing the deal',
        body: 'When both sides are satisfied, the deal is marked as active and the campaign timeline begins. At this point, deadlines on your calendar become binding. Missing deadlines can impact your reputation tier.',
      },
    ],
  },
  {
    id: 'missions',
    label: 'Missions & XP',
    title: 'Missions and XP Progression',
    intro:
      'Missions are daily and weekly tasks that reward XP. XP builds your rank, which directly affects how often you appear in sponsor searches and how many campaigns you can apply to simultaneously.',
    steps: [
      {
        title: 'Types of missions',
        body: 'Missions range from platform activities (stream for 2 hours, post a video) to platform-level actions (apply to a campaign, complete a deal). Each mission shows its XP reward. Completed missions are marked automatically once the platform data syncs.',
      },
      {
        title: 'Earning XP',
        body: 'XP accumulates across all completed missions and campaigns. Your level and rank are shown on your dashboard and your public profile. Higher ranks unlock priority placement in sponsor searches.',
      },
      {
        title: 'Rank system',
        body: 'You start as a Recruit and advance through ranks as you earn XP. Each rank tier corresponds to a range of campaign budgets you are most likely to qualify for. Consistent activity keeps your rank climbing.',
      },
      {
        title: 'Calendar & scheduling',
        body: 'Use the dashboard calendar to log personal tasks and track campaign start/end dates. Campaign events appear automatically on the calendar when your applications are accepted. Add notes to specific days to stay organized.',
      },
    ],
  },
  {
    id: 'academy',
    label: 'Academy',
    title: 'The Creator Academy',
    intro:
      'The Academy is a library of video lessons on growing your channel, building your brand, and creating content that sponsors want. Lessons are free and accessible at any time from the sidebar.',
    steps: [
      {
        title: 'Browsing lessons',
        body: 'Click "Academy" in the sidebar to see all available lessons. Each lesson is categorized by topic — Growth, Branding, YouTube, and more. A random featured lesson appears on your dashboard each session.',
      },
      {
        title: 'Watching a lesson',
        body: 'Open a lesson to watch the video and follow along with the step-by-step breakdown below the player. Lessons are designed to be actionable — each step gives you something concrete to apply to your channel.',
      },
      {
        title: 'What you will learn',
        body: 'Topics include: how to grow a gaming channel from scratch, building a recognizable personal brand, optimizing your YouTube channel, understanding analytics, and creating content that attracts sponsors.',
      },
    ],
  },
  {
    id: 'payouts',
    label: 'Payouts',
    title: 'Getting Paid',
    intro:
      'Payouts are processed through Stripe once a campaign is complete and your deliverables are verified. Make sure your payout method is set up before a campaign ends.',
    steps: [
      {
        title: 'How payouts work',
        body: 'After you complete your campaign deliverables, the sponsor marks the campaign complete. nx8up verifies the deliverables and initiates a payout to your connected Stripe account. The platform fee is deducted automatically.',
      },
      {
        title: 'Setting up Stripe',
        body: 'Go to your Profile and connect a Stripe account for payouts. You will need to complete Stripe\'s identity verification before your first payout can be processed. This is a one-time setup.',
      },
      {
        title: 'Payout timeline',
        body: 'Payouts typically process within 3–5 business days after verification. You can check the status of any pending payout from the Campaigns tab under "Payout due." If a payout is delayed, contact support.',
      },
      {
        title: 'Platform fee',
        body: 'nx8up charges a platform fee on each completed deal. The fee is shown on the campaign details page before you apply, so you always know your net payout in advance.',
      },
    ],
  },
]

export default function GuideContent() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id)
  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]

  return (
    <div className="flex gap-6">
      {/* Tab sidebar */}
      <nav className="w-48 shrink-0">
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => setActiveId(section.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  section.id === activeId
                    ? 'bg-[#99f7ff]/10 text-[#99f7ff] border border-[#99f7ff]/30'
                    : 'text-[#a9abb5] hover:bg-white/5 hover:text-[#e8f4ff] border border-transparent'
                }`}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content area */}
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-white/10 bg-black/20 p-6">
          <h2 className="font-headline text-xl font-semibold text-[#e8f4ff]">{active.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#a9abb5]">{active.intro}</p>

          <div className="mt-6 space-y-5">
            {active.steps.map((step, i) => (
              <div key={step.title} className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-[10px] font-bold text-[#99f7ff]">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#e8f4ff]">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[#a9abb5]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {SECTIONS.findIndex((s) => s.id === activeId) > 0 && (
            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeId)
                setActiveId(SECTIONS[idx - 1].id)
              }}
              className="text-sm text-[#a9abb5] transition hover:text-[#99f7ff]"
            >
              ← Previous
            </button>
          )}
          {SECTIONS.findIndex((s) => s.id === activeId) < SECTIONS.length - 1 && (
            <button
              type="button"
              onClick={() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeId)
                setActiveId(SECTIONS[idx + 1].id)
              }}
              className="ml-auto text-sm text-[#a9abb5] transition hover:text-[#99f7ff]"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
