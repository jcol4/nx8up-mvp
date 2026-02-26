'use client'

import { useState, useMemo } from 'react'

const DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = last.getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

type Props = {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export default function CreatorCalendar({ selectedDate, onSelectDate }: Props) {
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate))
  const today = new Date()

  const cells = useMemo(
    () => getMonthDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  )

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const isToday = (d: number) =>
    today.getDate() === d &&
    today.getMonth() === viewDate.getMonth() &&
    today.getFullYear() === viewDate.getFullYear()

  const isSelected = (d: number) =>
    selectedDate.getDate() === d &&
    selectedDate.getMonth() === viewDate.getMonth() &&
    selectedDate.getFullYear() === viewDate.getFullYear()

  const handleClick = (d: number) => {
    onSelectDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))
  }

  const handlePrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded cr-text-muted hover:text-[#c8dff0] hover:bg-white/5 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-medium cr-text-bright">{monthLabel}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded cr-text-muted hover:text-[#c8dff0] hover:bg-white/5 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {DAYS.map((d) => (
          <span key={d} className="cr-text-muted font-medium">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => d !== null && handleClick(d)}
            disabled={d === null}
            className={`min-w-[28px] py-1.5 rounded transition-colors inline-flex items-center justify-center ${
              d === null
                ? 'invisible cursor-default'
                : isToday(d)
                  ? 'bg-[#00c8ff] text-black font-semibold ring-1 ring-[#7b4fff]/50'
                  : isSelected(d)
                    ? 'bg-[#00c8ff]/40 text-[#c8dff0] ring-1 ring-[#00c8ff]/60'
                    : 'cr-text-muted hover:bg-white/10 hover:text-[#c8dff0]'
            }`}
          >
            {d ?? ''}
          </button>
        ))}
      </div>
    </div>
  )
}
