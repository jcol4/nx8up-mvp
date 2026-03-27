'use client'

import { useState } from 'react'
import Link from 'next/link'
import Panel from '@/components/shared/Panel'
import TabBar from '@/components/ui/TabBar'

type Tab = 'Active' | 'Pending' | 'Payout due'
const TABS: Tab[] = ['Active', 'Pending', 'Payout due']

type Application = {
  id: string
  status: string
  submitted_at: Date | null
  campaign: {
    id: string
    title: string
    budget: number | null
    end_date: Date | null
    sponsor: { company_name: string | null }
  }
}

type Props = {
  applications: Application[]
}

export default function DealsAndCampaignsSection({ applications }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Active')

  const byTab: Record<Tab, Application[]> = {
    Active: applications.filter((a) => a.status === 'accepted'),
    Pending: applications.filter((a) => a.status === 'pending'),
    'Payout due': [],
  }

  const items = byTab[activeTab]

  return (
    <Panel variant="creator" title="Campaigns" className="flex flex-col">
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-4" />

      <ul className="space-y-2.5 flex-1 min-h-0 overflow-y-auto max-h-[280px] pr-1">
        {items.length === 0 ? (
          <li className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm cr-text-muted">
              {activeTab === 'Active' && 'No active campaigns yet.'}
              {activeTab === 'Pending' && 'No pending applications.'}
              {activeTab === 'Payout due' && 'No payouts due.'}
            </p>
            {activeTab !== 'Payout due' && (
              <Link
                href="/creator/campaigns"
                className="mt-2 text-xs text-[#00c8ff] hover:underline"
              >
                Browse campaigns →
              </Link>
            )}
          </li>
        ) : (
          items.map((app) => (
            <li key={app.id} className="shrink-0">
              <Link
                href={`/creator/campaigns/${app.campaign.id}`}
                className="block p-3 rounded-lg cr-border border cr-bg-inner hover:border-[rgba(0,200,255,0.3)] transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium cr-text-bright group-hover:text-[#00c8ff] transition-colors leading-tight">
                    {app.campaign.title}
                  </span>
                  {app.campaign.budget != null && (
                    <span className="text-sm font-semibold cr-success shrink-0">
                      ${app.campaign.budget.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="text-xs cr-text-muted mt-0.5">
                  {app.campaign.sponsor.company_name ?? 'Sponsor'}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      app.status === 'accepted'
                        ? 'bg-[#22c55e]/15 text-[#22c55e]'
                        : app.status === 'pending'
                          ? 'bg-[#eab308]/15 text-[#eab308]'
                          : 'bg-white/5 cr-text-muted'
                    }`}
                  >
                    {app.status === 'accepted' ? 'Accepted' : 'Pending review'}
                  </span>
                  {app.campaign.end_date && (
                    <span className="text-[10px] cr-text-muted">
                      Due {new Date(app.campaign.end_date!).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>

      <Link
        href="/creator/campaigns"
        className="mt-4 w-full text-center py-2 px-3 rounded-lg text-xs font-medium border cr-border cr-text-muted hover:border-[rgba(0,200,255,0.3)] hover:cr-text transition-colors"
      >
        View all campaigns
      </Link>
    </Panel>
  )
}
