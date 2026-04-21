/**
 * SponsorPostCampaignSection — full-width dashboard panel containing a CTA to
 * create a new campaign.
 *
 * Renders a brief description and a "Post a campaign" button that links to the
 * multi-step campaign creation wizard at /sponsor/campaigns/new. No server-side
 * data fetching — purely presentational.
 */
'use client'

import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'

export default function SponsorPostCampaignSection() {
  return (
    <DashboardPanel title="Post Campaign">
      <p className="dash-text-muted text-sm mb-4">
        Create a campaign for creators to discover and apply to. Set your budget, platforms, and requirements.
      </p>
      <Link
        href="/sponsor/campaigns/new"
        className="inline-flex py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Post a campaign
      </Link>
    </DashboardPanel>
  )
}
