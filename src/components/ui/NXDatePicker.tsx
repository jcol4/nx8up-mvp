'use client'

import * as React from 'react'

interface DatePickerProps {
  name: string
  required?: boolean
  max?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function NXDatePicker({ name, required, max }: DatePickerProps) {
  const today = new Date()
  const maxDate = max ? new Date(max) : today

  const [isOpen, setIsOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Date | null>(null)
  const [viewYear, setViewYear] = React.useState(today.getFullYear() - 20)
  const [viewMonth, setViewMonth] = React.useState(today.getMonth())
  const [mode, setMode] = React.useState<'calendar' | 'month' | 'year'>('calendar')
  const ref = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const isDisabled = (date: Date) => date > maxDate

  const isSelected = (date: Date) => {
    if (!selected) return false
    return date.toDateString() === selected.toDateString()
  }

  const isToday = (date: Date) => date.toDateString() === today.toDateString()

  const handleDayClick = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    if (isDisabled(date)) return
    setSelected(date)
    setIsOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    const nextDate = new Date(viewYear, viewMonth + 1, 1)
    if (nextDate > maxDate) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const formattedValue = selected
    ? `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`
    : ''

  const displayValue = selected
    ? `${MONTHS[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
    : 'Select date of birth'

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // Year range for year picker
  const startYear = 1940
  const endYear = maxDate.getFullYear()
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i)

  return (
    <>
      <style>{`
        .nx-dp-wrap {
          position: relative;
          width: 100%;
        }

        .nx-dp-trigger {
          width: 100%;
          background: rgba(0,200,255,0.03);
          border: 1px solid rgba(0,200,255,0.12);
          border-left: none;
          border-radius: 0 6px 6px 0;
          padding: 0.85rem 1rem;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.95rem;
          color: #c8dff0;
          cursor: pointer;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }

        .nx-dp-trigger:hover,
        .nx-dp-trigger--open {
          border-color: rgba(0,200,255,0.3);
          background: rgba(0,200,255,0.05);
          box-shadow: 0 0 20px rgba(0,200,255,0.06);
        }

        .nx-dp-trigger--placeholder {
          color: #2a3f55;
        }

        .nx-dp-trigger-icon {
          color: #3a5570;
          flex-shrink: 0;
          transition: color 0.2s, transform 0.2s;
        }

        .nx-dp-trigger--open .nx-dp-trigger-icon {
          color: #00c8ff;
          transform: rotate(180deg);
        }

        .nx-dp-popup {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: rgba(8,16,32,0.98);
          border: 1px solid rgba(0,200,255,0.18);
          border-radius: 10px;
          z-index: 100;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(0,0,0,0.6),
            0 0 0 1px rgba(0,200,255,0.05),
            inset 0 1px 0 rgba(0,200,255,0.08);
          animation: dpSlideIn 0.15s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes dpSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nx-dp-popup::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
        }

        /* Header */
        .nx-dp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem 0.75rem;
          border-bottom: 1px solid rgba(0,200,255,0.07);
        }

        .nx-dp-nav {
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

        .nx-dp-nav:hover {
          background: rgba(0,200,255,0.1);
          border-color: rgba(0,200,255,0.25);
          color: #00c8ff;
        }

        .nx-dp-nav:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        .nx-dp-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nx-dp-month-btn,
        .nx-dp-year-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #c8dff0;
          padding: 3px 7px;
          border-radius: 4px;
          transition: background 0.15s, color 0.15s;
        }

        .nx-dp-month-btn:hover,
        .nx-dp-year-btn:hover {
          background: rgba(0,200,255,0.08);
          color: #00c8ff;
        }

        /* Day headers */
        .nx-dp-days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 0.5rem 0.75rem 0.25rem;
          gap: 2px;
        }

        .nx-dp-day-label {
          text-align: center;
          font-family: 'Rajdhani', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: #2a3f55;
          padding: 4px 0;
        }

        /* Calendar grid */
        .nx-dp-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 0 0.75rem 0.75rem;
          gap: 2px;
        }

        .nx-dp-cell {
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
        }

        .nx-dp-cell:hover:not(.nx-dp-cell--disabled):not(.nx-dp-cell--empty) {
          background: rgba(0,200,255,0.08);
          color: #c8dff0;
          border-color: rgba(0,200,255,0.15);
        }

        .nx-dp-cell--empty {
          cursor: default;
        }

        .nx-dp-cell--today {
          color: #00c8ff;
          font-weight: 600;
        }

        .nx-dp-cell--today::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px; height: 3px;
          background: #00c8ff;
          border-radius: 50%;
        }

        .nx-dp-cell--selected {
          background: linear-gradient(135deg, rgba(0,200,255,0.2), rgba(123,79,255,0.2)) !important;
          border-color: rgba(0,200,255,0.4) !important;
          color: #00c8ff !important;
          font-weight: 600;
          box-shadow: 0 0 12px rgba(0,200,255,0.15);
        }

        .nx-dp-cell--disabled {
          color: #1a2535;
          cursor: not-allowed;
        }

        /* Month picker */
        .nx-dp-month-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          padding: 0.75rem;
        }

        .nx-dp-month-item {
          padding: 0.6rem 0.25rem;
          text-align: center;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #4a6080;
          border-radius: 5px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
        }

        .nx-dp-month-item:hover {
          background: rgba(0,200,255,0.08);
          color: #c8dff0;
          border-color: rgba(0,200,255,0.15);
        }

        .nx-dp-month-item--active {
          background: rgba(0,200,255,0.12);
          border-color: rgba(0,200,255,0.25);
          color: #00c8ff;
        }

        /* Year picker */
        .nx-dp-year-list {
          max-height: 200px;
          overflow-y: auto;
          padding: 0.5rem 0.75rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,200,255,0.2) transparent;
        }

        .nx-dp-year-list::-webkit-scrollbar {
          width: 3px;
        }

        .nx-dp-year-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .nx-dp-year-list::-webkit-scrollbar-thumb {
          background: rgba(0,200,255,0.2);
          border-radius: 999px;
        }

        .nx-dp-year-item {
          padding: 0.45rem 0.75rem;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #4a6080;
          border-radius: 5px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.12s, color 0.12s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nx-dp-year-item:hover {
          background: rgba(0,200,255,0.08);
          color: #c8dff0;
        }

        .nx-dp-year-item--active {
          background: rgba(0,200,255,0.12);
          border-color: rgba(0,200,255,0.25);
          color: #00c8ff;
        }

        .nx-dp-year-item--active::after {
          content: '';
          width: 4px; height: 4px;
          background: #00c8ff;
          border-radius: 50%;
          box-shadow: 0 0 6px #00c8ff;
        }
      `}</style>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={formattedValue} />

      <div className="nx-dp-wrap" ref={ref}>
        <button
          type="button"
          className={`nx-dp-trigger ${isOpen ? 'nx-dp-trigger--open' : ''} ${!selected ? 'nx-dp-trigger--placeholder' : ''}`}
          onClick={() => setIsOpen(o => !o)}
        >
          <span>{displayValue}</span>
          <svg className="nx-dp-trigger-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {isOpen && (
          <div className="nx-dp-popup">
            {/* Calendar mode */}
            {mode === 'calendar' && (
              <>
                <div className="nx-dp-header">
                  <button type="button" className="nx-dp-nav" onClick={prevMonth}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <div className="nx-dp-title">
                    <button type="button" className="nx-dp-month-btn" onClick={() => setMode('month')}>
                      {MONTHS[viewMonth].slice(0, 3)}
                    </button>
                    <button type="button" className="nx-dp-year-btn" onClick={() => setMode('year')}>
                      {viewYear}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="nx-dp-nav"
                    onClick={nextMonth}
                    disabled={new Date(viewYear, viewMonth + 1, 1) > maxDate}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                <div className="nx-dp-days-header">
                  {DAYS.map(d => (
                    <div key={d} className="nx-dp-day-label">{d}</div>
                  ))}
                </div>

                <div className="nx-dp-grid">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="nx-dp-cell nx-dp-cell--empty" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const date = new Date(viewYear, viewMonth, day)
                    const disabled = isDisabled(date)
                    const selected_ = isSelected(date)
                    const today_ = isToday(date)
                    return (
                      <div
                        key={day}
                        className={[
                          'nx-dp-cell',
                          disabled ? 'nx-dp-cell--disabled' : '',
                          selected_ ? 'nx-dp-cell--selected' : '',
                          today_ && !selected_ ? 'nx-dp-cell--today' : '',
                        ].join(' ')}
                        onClick={() => handleDayClick(day)}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Month picker */}
            {mode === 'month' && (
              <>
                <div className="nx-dp-header">
                  <button type="button" className="nx-dp-nav" onClick={() => setViewYear(y => y - 1)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button type="button" className="nx-dp-year-btn" onClick={() => setMode('year')}>
                    {viewYear}
                  </button>
                  <button type="button" className="nx-dp-nav" onClick={() => setViewYear(y => y + 1)}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="nx-dp-month-grid">
                  {MONTHS.map((month, i) => (
                    <div
                      key={month}
                      className={`nx-dp-month-item ${i === viewMonth ? 'nx-dp-month-item--active' : ''}`}
                      onClick={() => { setViewMonth(i); setMode('calendar') }}
                    >
                      {month.slice(0, 3)}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Year picker */}
            {mode === 'year' && (
              <>
                <div className="nx-dp-header">
                  <span style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#3a5570',
                  }}>Select Year</span>
                  <button type="button" className="nx-dp-nav" onClick={() => setMode('calendar')}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10 2L2 10M2 2l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="nx-dp-year-list">
                  {years.map(year => (
                    <div
                      key={year}
                      className={`nx-dp-year-item ${year === viewYear ? 'nx-dp-year-item--active' : ''}`}
                      onClick={() => { setViewYear(year); setMode('month') }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}