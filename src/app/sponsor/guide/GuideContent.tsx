'use client'

import { useState } from 'react'

type Step = { title: string; body: string }
type Section = { id: string; label: string; title: string; intro: string; steps: Step[] }

const SECTIONS: Section[] = [
  {
    id: 'overview',
    label: 'Overview',
    title: 'Welcome to nx8up',
    intro:
      'nx8up connects sponsors with gaming content creators. You post campaigns, review creator applications, negotiate deals, and pay creators — all through a single platform with built-in reputation tracking and fraud protection.',
    steps: [
      {
        title: 'How it works',
        body: 'You create a campaign with your budget, content requirements, and timeline. Creators browse and apply. You review their applications, accept the ones that fit, negotiate deliverables in the Deal Room, and pay on completion. Every step is tracked on your dashboard.',
      },
      {
        title: 'Your dashboard',
        body: 'The sponsor dashboard shows your KPIs (live campaigns, total budget, accepted creators, acceptance rate), a quick-create button for new campaigns, your current campaign list, and a panel of creators that match your profile settings.',
      },
      {
        title: 'Reputation system',
        body: 'Your account has a reputation tier: Neutral, Trusted, or Verified (and Restricted/Sanctioned for policy violations). Higher tiers unlock access to top-tier creators and priority placement. Reputation is built by paying on time, communicating clearly, and completing campaigns.',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Company Profile',
    title: 'Setting Up Your Company Profile',
    intro:
      'Your profile tells creators who you are and helps the platform match you with relevant creators. A complete profile with clear targeting criteria produces better matches and more qualified applications.',
    steps: [
      {
        title: 'Basic information',
        body: 'Go to Profile in the sidebar. Add your company name and location. These appear on every campaign you post, so creators know who they are applying to work with.',
      },
      {
        title: 'Creator targeting preferences',
        body: 'Set your preferred platforms (Twitch, YouTube, etc.), content types, and game categories. These are used to filter the creator directory and surface matched creators on your dashboard. The more specific you are, the better your matches.',
      },
      {
        title: 'Budget range',
        body: 'Set a budget minimum and maximum to indicate the typical deal size for your campaigns. This is not binding — individual campaigns have their own budgets — but it helps creators self-select before applying. Note: ACH payments have a per-transaction limit enforced by Stripe.',
      },
      {
        title: 'Creator requirements',
        body: 'Specify minimum average viewers, subscribers/followers, and engagement rate. Creators who do not meet these thresholds are deprioritized in your matched creators panel. You can still accept any creator you want — these are filters, not hard blocks.',
      },
      {
        title: 'Age-restricted content',
        body: 'If your brand promotes age-restricted content (alcohol, gambling, etc.), submit an age restriction request from your Profile page. An admin reviews and approves these requests. You cannot run age-restricted campaigns without approval.',
      },
    ],
  },
  {
    id: 'campaigns',
    label: 'Creating Campaigns',
    title: 'Creating and Managing Campaigns',
    intro:
      'Campaigns are how you reach creators. Each campaign defines what you want created, what you will pay, and who you want to create it. Well-written campaigns with clear requirements attract better applications.',
    steps: [
      {
        title: 'Create a campaign',
        body: 'Click "New Campaign" from the dashboard or Campaigns page. Fill in the title, description, target platforms, content type, game category, budget, start date, and end date. The description is your brief — be specific about deliverables so creators know exactly what you expect.',
      },
      {
        title: 'Campaign statuses',
        body: 'Draft: not visible to creators yet. Live: open for applications. Active: deals are in progress. Completed: all deliverables done and payouts sent. Cancelled: campaign was withdrawn. You can edit a campaign while it is in Draft or Live status.',
      },
      {
        title: 'Direct invites',
        body: 'Instead of waiting for applications, you can invite specific creators directly to a campaign. Browse the creator directory, open a creator\'s profile, and send a direct invite. Invited creators see your campaign immediately in their Campaigns tab.',
      },
      {
        title: 'Campaign visibility',
        body: 'Live campaigns are visible to all creators who meet your platform and content type requirements. Campaigns marked as direct-invite-only are hidden from the general browse list and only visible to the creators you invite.',
      },
    ],
  },
  {
    id: 'creators',
    label: 'Finding Creators',
    title: 'Finding and Evaluating Creators',
    intro:
      'The Creators directory lets you browse all creators on the platform, filter by platform, size, and content type, and view their full stats before reaching out.',
    steps: [
      {
        title: 'Browse the directory',
        body: 'Click "Creators" in the sidebar. The directory lists all active, non-deleted creator profiles. Each card shows their platforms, follower/subscriber counts, average viewers, and engagement rate.',
      },
      {
        title: 'Matched creators',
        body: 'Your dashboard shows a "Matched Creators" panel populated using your profile targeting settings. These are creators who best match your preferred platforms, content type, and creator size requirements. Update your profile to refresh these matches.',
      },
      {
        title: 'Creator profiles',
        body: 'Click any creator to see their full profile: bio, linked platforms, platform stats, content categories, and reputation. Stats are synced from Twitch and YouTube automatically — you are always seeing live data.',
      },
      {
        title: 'Sending a direct invite',
        body: 'From a creator\'s profile page, click "Invite to Campaign" and select which of your live campaigns to invite them to. The creator receives a notification and can accept or decline the invitation.',
      },
    ],
  },
  {
    id: 'applications',
    label: 'Managing Applications',
    title: 'Reviewing Creator Applications',
    intro:
      'When creators apply to your campaigns, their applications appear in your campaign\'s Applications tab. You review their profile stats and decide whether to accept or reject.',
    steps: [
      {
        title: 'Finding applications',
        body: 'Go to Campaigns → select a campaign → click Applications. Each applicant\'s card shows their platform stats, follower count, average viewers, and engagement rate at the time of application.',
      },
      {
        title: 'Accepting an application',
        body: 'Click "Accept" on an application to move it to the Deal Room. The creator is notified immediately. You can accept multiple creators per campaign if your budget allows for more than one partnership.',
      },
      {
        title: 'Rejecting an application',
        body: 'Click "Reject" to decline an application. The creator is notified that this particular campaign was not a match. Rejected creators can still apply to your future campaigns.',
      },
      {
        title: 'What happens after acceptance',
        body: 'Accepted applications move to the Deal Room where you and the creator finalize deliverable specifics. The campaign only becomes active once the deal is confirmed by both parties.',
      },
    ],
  },
  {
    id: 'deal-room',
    label: 'Deal Room',
    title: 'The Deal Room',
    intro:
      'The Deal Room is a per-application negotiation space. You and the creator exchange messages to agree on deliverable specifics, timelines, and any adjustments to the deal before locking it in.',
    steps: [
      {
        title: 'Accessing the Deal Room',
        body: 'Click "Deal Room" in the sidebar to see all your active negotiations. Each row represents one accepted application. Click a row to open the conversation thread with that creator.',
      },
      {
        title: 'Negotiating deliverables',
        body: 'Use the Deal Room to clarify exactly what the creator will produce: video length, required talking points, posting schedule, disclosure language, and any performance requirements. Get everything agreed in writing here before the campaign starts.',
      },
      {
        title: 'Finalizing a deal',
        body: 'Once both parties confirm the terms, the deal is locked and the campaign becomes active for that creator. The agreed start and end dates trigger calendar events on both sides.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Billing',
    title: 'Payments and Billing',
    intro:
      'Payments are processed through Stripe. You pay creators after their deliverables are verified. nx8up deducts a platform fee automatically and handles the payout to the creator.',
    steps: [
      {
        title: 'How payments work',
        body: 'After a campaign completes and deliverables are verified, you initiate payment from the campaign page. Funds are held by Stripe and released to the creator once the platform confirms completion. The creator receives their portion after the platform fee is deducted.',
      },
      {
        title: 'Payment methods',
        body: 'nx8up supports card payments and ACH bank transfers. Set your preferred payment method in your Profile under "Payment Method." ACH has a per-transaction limit — campaigns with budgets above this limit must be split or paid by card.',
      },
      {
        title: 'Platform fee',
        body: 'A percentage-based platform fee is charged on each completed deal. The exact rate is shown on the campaign creation page and the payment confirmation screen. There are no hidden charges — the fee is always visible before you commit.',
      },
      {
        title: 'Payout history',
        body: 'Click "Payouts" in the sidebar to see a full history of all completed payments, including creator name, campaign, amount paid, and payout date. You can export this data for accounting purposes.',
      },
      {
        title: 'Refunds and disputes',
        body: 'If a creator fails to deliver or violates campaign terms, you can submit a refund request from the campaign page. An admin reviews the request and mediates the dispute. Decisions are final and communicated to both parties within 5 business days.',
      },
    ],
  },
]

export default function SponsorGuideContent() {
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
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  section.id === activeId
                    ? 'bg-[#99f7ff]/10 text-[#bffcff] border border-[#99f7ff]/40'
                    : 'cr-guide-nav-inactive hover:bg-white/5 border border-transparent'
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
        <div className="rounded-xl border border-white/10 bg-black/20 p-6 sm:p-7">
          <p className="cr-field-label mb-1">{active.label}</p>
          <h2 className="font-headline text-xl font-semibold text-[#e8f4ff] sm:text-2xl">{active.title}</h2>
          <p className="mt-3 text-sm leading-relaxed cr-text">{active.intro}</p>

          <div className="mt-6 space-y-4">
            {active.steps.map((step, i) => (
              <div key={step.title} className="cr-guide-step-card rounded-lg border p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#99f7ff]/40 bg-[#99f7ff]/10 text-nx-10 font-bold text-[#99f7ff]">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-[#e8f4ff] sm:text-base">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed cr-text-muted sm:pl-9">{step.body}</p>
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
              className="text-sm cr-text-muted transition hover:text-[#99f7ff]"
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
              className="ml-auto text-sm cr-text-muted transition hover:text-[#99f7ff]"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
