'use client'

import { useState, useMemo } from 'react'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
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

  const monthShort = viewDate.toLocaleDateString('en-US', { month: 'short' })
  const year = viewDate.getFullYear()

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
    <>
      <style>{`
        .cr-cal-wrap {
          background: rgba(8,16,32,0.6);
          border: 1px solid rgba(0,200,255,0.18);
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 0 1px rgba(0,200,255,0.05), inset 0 1px 0 rgba(0,200,255,0.08);
        }
        .cr-cal-wrap::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
        }
        .cr-cal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem 0.75rem;
          border-bottom: 1px solid rgba(0,200,255,0.07);
        }
        .cr-cal-nav {
          width: 28px; height: 28px;
          background: rgba(0,200,255,0.05);
          border: 1px solid rgba(0,200,255,0.1);
          border-radius: 5px;
          color: #3a5570;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          flex-shrink: 0;
        }
        .cr-cal-nav:hover {
          background: rgba(0,200,255,0.1);
          border-color: rgba(0,200,255,0.25);
          color: #00c8ff;
        }
        .cr-cal-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cr-cal-month, .cr-cal-year {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #c8dff0;
          padding: 3px 7px;
          border-radius: 4px;
          background: none;
          border: none;
        }
        .cr-cal-days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 0.5rem 0.75rem 0.25rem;
          gap: 2px;
        }
        .cr-cal-day-label {
          text-align: center;
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #2a3f55;
          padding: 4px 0;
        }
        .cr-cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 0 0.75rem 0.75rem;
          gap: 2px;
        }
        .cr-cal-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.8rem;
          font-weight: 400;
          color: #4a6080;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          border: 1px solid transparent;
          position: relative;
          background: none;
        }
        .cr-cal-cell:hover:not(.cr-cal-cell--empty) {
          background: rgba(0,200,255,0.08);
          color: #c8dff0;
          border-color: rgba(0,200,255,0.15);
        }
        .cr-cal-cell--empty { cursor: default; pointer-events: none; }
        .cr-cal-cell--today { color: #00c8ff; font-weight: 600; }
        .cr-cal-cell--today::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px; height: 3px;
          background: #00c8ff;
          border-radius: 50%;
        }
        .cr-cal-cell--selected {
          background: linear-gradient(135deg, rgba(0,200,255,0.2), rgba(123,79,255,0.2)) !important;
          border-color: rgba(0,200,255,0.4) !important;
          color: #00c8ff !important;
          font-weight: 600;
          box-shadow: 0 0 12px rgba(0,200,255,0.15);
        }
      `}</style>
      <div className="cr-cal-wrap">
        <div className="cr-cal-header">
          <button type="button" className="cr-cal-nav" onClick={handlePrevMonth} aria-label="Previous month">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="cr-cal-title">
            <span className="cr-cal-month">{monthShort}</span>
            <span className="cr-cal-year">{year}</span>
          </div>
          <button type="button" className="cr-cal-nav" onClick={handleNextMonth} aria-label="Next month">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="cr-cal-days-header">
          {DAYS.map((d) => (
            <div key={d} className="cr-cal-day-label">{d}</div>
          ))}
        </div>
        <div className="cr-cal-grid">
          {cells.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => d !== null && handleClick(d)}
              disabled={d === null}
              className={`cr-cal-cell ${
                d === null
                  ? 'cr-cal-cell--empty'
                  : [
                      isToday(d) ? 'cr-cal-cell--today' : '',
                      isSelected(d) ? 'cr-cal-cell--selected' : '',
                    ].filter(Boolean).join(' ')
              }`}
            >
              {d ?? ''}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
