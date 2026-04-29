'use client'

import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'

export default function SponsorPostCampaignSection() {
  return (
    <DashboardPanel title="Post Campaign">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="dash-text-muted text-sm mb-4">
            Launch campaigns creators can discover and apply to with clear budget, deliverables, and targeting.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/sponsor/campaigns/new"
              className="inline-flex py-2.5 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Post a campaign
            </Link>
            <Link
              href="/sponsor/campaigns"
              className="inline-flex py-2.5 px-4 rounded-lg border border-white/10 text-sm text-[#c8dff0] hover:border-[#99f7ff]/35 hover:text-[#99f7ff] transition-colors"
            >
              Manage campaigns
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#a9abb5]">Campaign Checklist</p>
          <ul className="mt-2 space-y-1.5 text-xs text-[#c8dff0]">
            <li>- Budget and payout terms</li>
            <li>- Platforms and content format</li>
            <li>- Audience and game category</li>
          </ul>
        </div>
      </div>
    </DashboardPanel>
  )
}
