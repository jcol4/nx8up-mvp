'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateContentPlannerNotes } from './_actions'
import type { ContentPlannerNotes } from './_actions'
import TabBar from '@/components/ui/TabBar'
import SecondaryButton from '@/components/ui/SecondaryButton'

type Tab = 'Active' | 'Pending' | 'Payout due'

type Props = {
  initialNotes: ContentPlannerNotes
}

const PLANNER_BY_TAB: Record<Tab, { name: string; amount: string; tag: string; status: string }[]> = {
  Active: [
    { name: 'Cyber Gaming Ltd', amount: '$300 / 4', tag: 'Warzone / Apex', status: 'Waiting for payment' },
    { name: 'PB Lanes', amount: '$120 / 5', tag: '5//5 Campaign', status: 'In progress' },
    { name: 'StreamGear', amount: '$180 / 2', tag: 'Unboxing Video', status: 'Content due' },
  ],
  Pending: [
    { name: 'TechBrand Co', amount: '$250 / 3', tag: 'Product Review', status: 'Awaiting approval' },
    { name: 'GamingHub', amount: '$400 / 4', tag: 'Live Stream', status: 'Proposal sent' },
  ],
  'Payout due': [
    { name: 'Cyber Gaming Ltd', amount: '$300 / 4', tag: 'Warzone / Apex', status: 'Ready for payout' },
    { name: 'PB Lanes', amount: '$120 / 5', tag: '5//5 Campaign', status: 'Ready for payout' },
  ],
}

const TABS: Tab[] = ['Active', 'Pending', 'Payout due']

export default function ContentPlannerSection({ initialNotes }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('Active')
  const [notes, setNotes] = useState<ContentPlannerNotes>(initialNotes)
  const [localNotes, setLocalNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const noteKey = `planner-${activeTab}`

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  useEffect(() => {
    setLocalNotes(notes[noteKey] ?? '')
  }, [activeTab, noteKey, notes])

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNotesChange = (value: string) => {
    setLocalNotes(value)
    const next = { ...notes, [noteKey]: value }
    setNotes(next)

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true)
      updateContentPlannerNotes(next).then(() => {
        setIsSaving(false)
        router.refresh()
      })
      saveTimeoutRef.current = null
    }, 500)
  }

  const items = PLANNER_BY_TAB[activeTab]

  return (
    <section className="cr-panel flex flex-col">
      <h2 className="cr-panel-title">Content Planner</h2>
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-4" />
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1 shrink-0">
          {items.map((item, i) => (
            <div
              key={`${activeTab}-${i}`}
              className="p-3 rounded-lg cr-border border cr-bg-inner"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium cr-text-bright">{item.name}</span>
                <span className="text-sm cr-text-muted">{item.amount}</span>
              </div>
              <p className="text-xs cr-text-muted mt-0.5">{item.tag}</p>
              <p className="text-xs cr-text-muted mt-1">{item.status}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 min-h-0 flex flex-col shrink-0">
          <label className="block text-xs font-medium cr-text-muted mb-1.5">Notes</label>
          <textarea
            value={localNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes for this tab..."
            className="w-full px-3 py-2 rounded-lg cr-border border cr-bg-inner cr-text placeholder-[#3a5570] focus:outline-none focus:ring-1 focus:ring-[#00c8ff]/50 text-sm resize-none min-h-[80px]"
            rows={3}
          />
          {isSaving && (
            <span className="text-[10px] cr-text-muted mt-0.5">Saving...</span>
          )}
        </div>
      </div>
      <SecondaryButton className="mt-4">Manage my deals</SecondaryButton>
    </section>
  )
}
