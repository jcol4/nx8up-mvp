'use client'

import { useState } from 'react'
import TabBar from '@/components/ui/TabBar'
import ProgressBar from '@/components/ui/ProgressBar'
import SecondaryButton from '@/components/ui/SecondaryButton'

type Tab = 'Active' | 'Pending' | 'Payout due'

const DEALS_BY_TAB: Record<Tab, { name: string; tag: string; amount: string; progress: number }[]> = {
  Active: [
    { name: 'Cyber Gaming Ltd', tag: 'Warzone / Apex', amount: '$300', progress: 2 },
    { name: 'PB Lanes', tag: '5//5 Campaign', amount: '$120', progress: 1 },
  ],
  Pending: [
    { name: 'TechBrand Co', tag: 'Product Review', amount: '$250', progress: 0 },
    { name: 'StreamGear', tag: 'Unboxing Video', amount: '$180', progress: 0 },
  ],
  'Payout due': [
    { name: 'Cyber Gaming Ltd', tag: 'Warzone / Apex', amount: '$300', progress: 3 },
    { name: 'PB Lanes', tag: '5//5 Campaign', amount: '$120', progress: 3 },
  ],
}

const TABS: Tab[] = ['Active', 'Pending', 'Payout due']

export default function DealsAndCampaignsSection() {
  const [activeTab, setActiveTab] = useState<Tab>('Active')
  const deals = DEALS_BY_TAB[activeTab]

  return (
    <section className="cr-panel flex flex-col">
      <h2 className="cr-panel-title">Deals & Campaigns</h2>
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-4" />
      <ul className="space-y-3 flex-1 min-h-0 overflow-y-auto max-h-[280px] pr-1">
        {deals.map((d, i) => (
          <li key={`${activeTab}-${i}`} className="p-3 rounded-lg cr-border border cr-bg-inner shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium cr-text-bright">{d.name}</span>
              <span className="text-sm font-semibold cr-success flex items-center gap-1">
                ✓ {d.amount}
              </span>
            </div>
            <p className="text-xs cr-text-muted mt-0.5">{d.tag}</p>
            <div className="mt-2">
              <ProgressBar value={d.progress} max={3} variant="gradient" />
            </div>
          </li>
        ))}
      </ul>
      <SecondaryButton className="mt-4">Manage my deals</SecondaryButton>
    </section>
  )
}
