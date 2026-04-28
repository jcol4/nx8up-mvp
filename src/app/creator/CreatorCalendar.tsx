// /**
//  * CreatorCalendar — a self-contained mini-calendar widget for the creator
//  * dashboard. Renders one month at a time with prev/next navigation.
//  *
//  * The calendar maintains its own `viewDate` state (which month is visible)
//  * independently from the `selectedDate` prop (controlled by the parent).
//  * This lets the user browse months without changing the selected day.
//  *
//  * Days are rendered as `<button>` elements so keyboard navigation works
//  * out of the box. Empty cells (before the 1st) are disabled `<button>`s
//  * with `pointer-events: none`.
//  *
//  * Visual highlights:
//  *  - Today → cyan dot below the day number
//  *  - Selected → gradient background + cyan border
//  *
//  * All styles are inline CSS injected via a `<style>` tag under the `.cr-cal-`
//  * namespace to stay consistent with the creator dashboard design system.
//  */
// 'use client'

// import { useState, useMemo } from 'react'

// const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

// /**
//  * Builds the grid cells for a given month.
//  * Leading `null` values represent the empty cells before the 1st of the month
//  * (offset determined by `Date.getDay()` of the 1st).
//  */
// function getMonthDays(year: number, month: number) {
//   const first = new Date(year, month, 1)
//   const last = new Date(year, month + 1, 0)
//   const startPad = first.getDay()
//   const daysInMonth = last.getDate()
//   const cells: (number | null)[] = []
//   for (let i = 0; i < startPad; i++) cells.push(null)
//   for (let d = 1; d <= daysInMonth; d++) cells.push(d)
//   return cells
// }

// type Props = {
//   selectedDate: Date
//   onSelectDate: (date: Date) => void
// }

// export default function CreatorCalendar({ selectedDate, onSelectDate }: Props) {
//   const [viewDate, setViewDate] = useState(() => new Date(selectedDate))
//   const today = new Date()

//   const cells = useMemo(
//     () => getMonthDays(viewDate.getFullYear(), viewDate.getMonth()),
//     [viewDate]
//   )

//   const monthShort = viewDate.toLocaleDateString('en-US', { month: 'short' })
//   const year = viewDate.getFullYear()

//   const isToday = (d: number) =>
//     today.getDate() === d &&
//     today.getMonth() === viewDate.getMonth() &&
//     today.getFullYear() === viewDate.getFullYear()

//   const isSelected = (d: number) =>
//     selectedDate.getDate() === d &&
//     selectedDate.getMonth() === viewDate.getMonth() &&
//     selectedDate.getFullYear() === viewDate.getFullYear()

//   const handleClick = (d: number) => {
//     onSelectDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))
//   }

//   const handlePrevMonth = () => {
//     setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
//   }

//   const handleNextMonth = () => {
//     setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
//   }

//   return (
//     <>
//       <style>{`
//         .cr-cal-wrap {
//           background: rgba(8,16,32,0.6);
//           border: 1px solid rgba(0,200,255,0.18);
//           border-radius: 10px;
//           overflow: hidden;
//           box-shadow: 0 0 0 1px rgba(0,200,255,0.05), inset 0 1px 0 rgba(0,200,255,0.08);
//         }
//         .cr-cal-wrap::before {
//           content: '';
//           display: block;
//           height: 1px;
//           background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
//         }
//         .cr-cal-header {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0.875rem 1rem 0.75rem;
//           border-bottom: 1px solid rgba(0,200,255,0.07);
//         }
//         .cr-cal-nav {
//           width: 28px; height: 28px;
//           background: rgba(0,200,255,0.05);
//           border: 1px solid rgba(0,200,255,0.1);
//           border-radius: 5px;
//           color: #3a5570;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: background 0.15s, color 0.15s, border-color 0.15s;
//           flex-shrink: 0;
//         }
//         .cr-cal-nav:hover {
//           background: rgba(0,200,255,0.1);
//           border-color: rgba(0,200,255,0.25);
//           color: #00c8ff;
//         }
//         .cr-cal-title {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }
//         .cr-cal-month, .cr-cal-year {
//           font-family: 'Rajdhani', sans-serif;
//           font-size: 0.9rem;
//           font-weight: 600;
//           letter-spacing: 0.06em;
//           text-transform: uppercase;
//           color: #c8dff0;
//           padding: 3px 7px;
//           border-radius: 4px;
//           background: none;
//           border: none;
//         }
//         .cr-cal-days-header {
//           display: grid;
//           grid-template-columns: repeat(7, 1fr);
//           padding: 0.5rem 0.75rem 0.25rem;
//           gap: 2px;
//         }
//         .cr-cal-day-label {
//           text-align: center;
//           font-family: 'Rajdhani', sans-serif;
//           font-size: 10px;
//           font-weight: 600;
//           letter-spacing: 0.1em;
//           color: #2a3f55;
//           padding: 4px 0;
//         }
//         .cr-cal-grid {
//           display: grid;
//           grid-template-columns: repeat(7, 1fr);
//           padding: 0 0.75rem 0.75rem;
//           gap: 2px;
//         }
//         .cr-cal-cell {
//           aspect-ratio: 1;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-family: 'Exo 2', sans-serif;
//           font-size: 0.8rem;
//           font-weight: 400;
//           color: #4a6080;
//           border-radius: 5px;
//           cursor: pointer;
//           transition: background 0.12s, color 0.12s;
//           border: 1px solid transparent;
//           position: relative;
//           background: none;
//         }
//         .cr-cal-cell:hover:not(.cr-cal-cell--empty) {
//           background: rgba(0,200,255,0.08);
//           color: #c8dff0;
//           border-color: rgba(0,200,255,0.15);
//         }
//         .cr-cal-cell--empty { cursor: default; pointer-events: none; }
//         .cr-cal-cell--today { color: #00c8ff; font-weight: 600; }
//         .cr-cal-cell--today::after {
//           content: '';
//           position: absolute;
//           bottom: 3px;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 3px; height: 3px;
//           background: #00c8ff;
//           border-radius: 50%;
//         }
//         .cr-cal-cell--selected {
//           background: linear-gradient(135deg, rgba(0,200,255,0.2), rgba(123,79,255,0.2)) !important;
//           border-color: rgba(0,200,255,0.4) !important;
//           color: #00c8ff !important;
//           font-weight: 600;
//           box-shadow: 0 0 12px rgba(0,200,255,0.15);
//         }
//       `}</style>
//       <div className="cr-cal-wrap">
//         <div className="cr-cal-header">
//           <button type="button" className="cr-cal-nav" onClick={handlePrevMonth} aria-label="Previous month">
//             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//               <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//           <div className="cr-cal-title">
//             <span className="cr-cal-month">{monthShort}</span>
//             <span className="cr-cal-year">{year}</span>
//           </div>
//           <button type="button" className="cr-cal-nav" onClick={handleNextMonth} aria-label="Next month">
//             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//               <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//         </div>
//         <div className="cr-cal-days-header">
//           {DAYS.map((d) => (
//             <div key={d} className="cr-cal-day-label">{d}</div>
//           ))}
//         </div>
//         <div className="cr-cal-grid">
//           {cells.map((d, i) => (
//             <button
//               key={i}
//               type="button"
//               onClick={() => d !== null && handleClick(d)}
//               disabled={d === null}
//               className={`cr-cal-cell ${
//                 d === null
//                   ? 'cr-cal-cell--empty'
//                   : [
//                       isToday(d) ? 'cr-cal-cell--today' : '',
//                       isSelected(d) ? 'cr-cal-cell--selected' : '',
//                     ].filter(Boolean).join(' ')
//               }`}
//             >
//               {d ?? ''}
//             </button>
//           ))}
//         </div>
//       </div>
//     </>
//   )
// }







// /**
//  * CreatorCalendar — a self-contained mini-calendar widget for the creator
//  * dashboard. Renders one month at a time with prev/next navigation.
//  *
//  * The calendar maintains its own `viewDate` state (which month is visible)
//  * independently from the `selectedDate` prop (controlled by the parent).
//  * This lets the user browse months without changing the selected day.
//  *
//  * Days are rendered as `<button>` elements so keyboard navigation works
//  * out of the box. Empty cells (before the 1st) are disabled `<button>`s
//  * with `pointer-events: none`.
//  *
//  * Visual highlights:
//  *  - Today → cyan dot below the day number
//  *  - Selected → gradient background + cyan border
//  *  - Campaign start day → magenta dot in top-right corner
//  *  - Campaign end day → orange dot in top-right corner
//  *  - Both start AND end on same day → split-color dot
//  *  - Mid-campaign day (active but not start/end) → small magenta underline
//  *
//  * All styles are inline CSS injected via a `<style>` tag under the `.cr-cal-`
//  * namespace to stay consistent with the creator dashboard design system.
//  */
// 'use client'

// import { useState, useMemo } from 'react'
// import type { CampaignDateMap } from './_actions'

// const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

// /**
//  * Builds the grid cells for a given month.
//  * Leading `null` values represent the empty cells before the 1st of the month
//  * (offset determined by `Date.getDay()` of the 1st).
//  */
// function getMonthDays(year: number, month: number) {
//   const first = new Date(year, month, 1)
//   const last = new Date(year, month + 1, 0)
//   const startPad = first.getDay()
//   const daysInMonth = last.getDate()
//   const cells: (number | null)[] = []
//   for (let i = 0; i < startPad; i++) cells.push(null)
//   for (let d = 1; d <= daysInMonth; d++) cells.push(d)
//   return cells
// }

// type Props = {
//   selectedDate: Date
//   onSelectDate: (date: Date) => void
//   /**
//    * Map of YYYY-MM-DD date keys to campaign metadata for that day.
//    * If undefined or missing for a given day, no indicator is shown.
//    */
//   campaignDates?: CampaignDateMap
// }

// export default function CreatorCalendar({ selectedDate, onSelectDate, campaignDates = {} }: Props) {
//   const [viewDate, setViewDate] = useState(() => new Date(selectedDate))
//   const today = new Date()

//   const cells = useMemo(
//     () => getMonthDays(viewDate.getFullYear(), viewDate.getMonth()),
//     [viewDate]
//   )

//   const monthShort = viewDate.toLocaleDateString('en-US', { month: 'short' })
//   const year = viewDate.getFullYear()

//   const isToday = (d: number) =>
//     today.getDate() === d &&
//     today.getMonth() === viewDate.getMonth() &&
//     today.getFullYear() === viewDate.getFullYear()

//   const isSelected = (d: number) =>
//     selectedDate.getDate() === d &&
//     selectedDate.getMonth() === viewDate.getMonth() &&
//     selectedDate.getFullYear() === viewDate.getFullYear()

//   /** Builds a YYYY-MM-DD key for a calendar cell day in UTC. */
//   const dayKey = (d: number) => {
//     const dt = new Date(Date.UTC(viewDate.getFullYear(), viewDate.getMonth(), d))
//     return dt.toISOString().slice(0, 10)
//   }

//   /** Returns campaign info for a day, or null if no campaigns. */
//   const getCampaignInfo = (d: number) => {
//     const info = campaignDates[dayKey(d)]
//     if (!info || info.count === 0) return null
//     return info
//   }

//   const handleClick = (d: number) => {
//     onSelectDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))
//   }

//   const handlePrevMonth = () => {
//     setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
//   }

//   const handleNextMonth = () => {
//     setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
//   }

//   return (
//     <>
//       <style>{`
//         .cr-cal-wrap {
//           background: rgba(8,16,32,0.6);
//           border: 1px solid rgba(0,200,255,0.18);
//           border-radius: 10px;
//           overflow: hidden;
//           box-shadow: 0 0 0 1px rgba(0,200,255,0.05), inset 0 1px 0 rgba(0,200,255,0.08);
//         }
//         .cr-cal-wrap::before {
//           content: '';
//           display: block;
//           height: 1px;
//           background: linear-gradient(90deg, transparent, #00c8ff, #7b4fff, transparent);
//         }
//         .cr-cal-header {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0.875rem 1rem 0.75rem;
//           border-bottom: 1px solid rgba(0,200,255,0.07);
//         }
//         .cr-cal-nav {
//           width: 28px; height: 28px;
//           background: rgba(0,200,255,0.05);
//           border: 1px solid rgba(0,200,255,0.1);
//           border-radius: 5px;
//           color: #3a5570;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: background 0.15s, color 0.15s, border-color 0.15s;
//           flex-shrink: 0;
//         }
//         .cr-cal-nav:hover {
//           background: rgba(0,200,255,0.1);
//           border-color: rgba(0,200,255,0.25);
//           color: #00c8ff;
//         }
//         .cr-cal-title {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//         }
//         .cr-cal-month, .cr-cal-year {
//           font-family: 'Rajdhani', sans-serif;
//           font-size: 0.9rem;
//           font-weight: 600;
//           letter-spacing: 0.06em;
//           text-transform: uppercase;
//           color: #c8dff0;
//           padding: 3px 7px;
//           border-radius: 4px;
//           background: none;
//           border: none;
//         }
//         .cr-cal-days-header {
//           display: grid;
//           grid-template-columns: repeat(7, 1fr);
//           padding: 0.5rem 0.75rem 0.25rem;
//           gap: 2px;
//         }
//         .cr-cal-day-label {
//           text-align: center;
//           font-family: 'Rajdhani', sans-serif;
//           font-size: 10px;
//           font-weight: 600;
//           letter-spacing: 0.1em;
//           color: #2a3f55;
//           padding: 4px 0;
//         }
//         .cr-cal-grid {
//           display: grid;
//           grid-template-columns: repeat(7, 1fr);
//           padding: 0 0.75rem 0.75rem;
//           gap: 2px;
//         }
//         .cr-cal-cell {
//           aspect-ratio: 1;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-family: 'Exo 2', sans-serif;
//           font-size: 0.8rem;
//           font-weight: 400;
//           color: #4a6080;
//           border-radius: 5px;
//           cursor: pointer;
//           transition: background 0.12s, color 0.12s;
//           border: 1px solid transparent;
//           position: relative;
//           background: none;
//         }
//         .cr-cal-cell:hover:not(.cr-cal-cell--empty) {
//           background: rgba(0,200,255,0.08);
//           color: #c8dff0;
//           border-color: rgba(0,200,255,0.15);
//         }
//         .cr-cal-cell--empty { cursor: default; pointer-events: none; }
//         .cr-cal-cell--today { color: #00c8ff; font-weight: 600; }
//         .cr-cal-cell--today::after {
//           content: '';
//           position: absolute;
//           bottom: 3px;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 3px; height: 3px;
//           background: #00c8ff;
//           border-radius: 50%;
//         }
//         .cr-cal-cell--selected {
//           background: linear-gradient(135deg, rgba(0,200,255,0.2), rgba(123,79,255,0.2)) !important;
//           border-color: rgba(0,200,255,0.4) !important;
//           color: #00c8ff !important;
//           font-weight: 600;
//           box-shadow: 0 0 12px rgba(0,200,255,0.15);
//         }
//         /* Campaign indicators */
//         .cr-cal-campaign-dot {
//           position: absolute;
//           top: 3px;
//           right: 3px;
//           width: 5px;
//           height: 5px;
//           border-radius: 50%;
//         }
//         .cr-cal-campaign-dot--start { background: #c084fc; }
//         .cr-cal-campaign-dot--end { background: #ff9f4a; }
//         .cr-cal-campaign-dot--both {
//           background: linear-gradient(135deg, #c084fc 50%, #ff9f4a 50%);
//         }
//         .cr-cal-campaign-dot--mid { background: rgba(192, 132, 252, 0.5); }
//       `}</style>
//       <div className="cr-cal-wrap">
//         <div className="cr-cal-header">
//           <button type="button" className="cr-cal-nav" onClick={handlePrevMonth} aria-label="Previous month">
//             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//               <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//           <div className="cr-cal-title">
//             <span className="cr-cal-month">{monthShort}</span>
//             <span className="cr-cal-year">{year}</span>
//           </div>
//           <button type="button" className="cr-cal-nav" onClick={handleNextMonth} aria-label="Next month">
//             <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
//               <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//         </div>
//         <div className="cr-cal-days-header">
//           {DAYS.map((d) => (
//             <div key={d} className="cr-cal-day-label">{d}</div>
//           ))}
//         </div>
//         <div className="cr-cal-grid">
//           {cells.map((d, i) => {
//             const info = d !== null ? getCampaignInfo(d) : null
//             let dotClass: string | null = null
//             let dotTitle = ''
//             if (info) {
//               if (info.isStart && info.isEnd) {
//                 dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--both'
//                 dotTitle = 'Campaign starts and ends today'
//               } else if (info.isStart) {
//                 dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--start'
//                 dotTitle = 'Campaign starts today'
//               } else if (info.isEnd) {
//                 dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--end'
//                 dotTitle = 'Campaign ends today'
//               } else {
//                 dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--mid'
//                 dotTitle = 'Campaign active'
//               }
//             }

//             return (
//               <button
//                 key={i}
//                 type="button"
//                 onClick={() => d !== null && handleClick(d)}
//                 disabled={d === null}
//                 title={dotTitle || undefined}
//                 className={`cr-cal-cell ${
//                   d === null
//                     ? 'cr-cal-cell--empty'
//                     : [
//                         isToday(d) ? 'cr-cal-cell--today' : '',
//                         isSelected(d) ? 'cr-cal-cell--selected' : '',
//                       ].filter(Boolean).join(' ')
//                 }`}
//               >
//                 {d ?? ''}
//                 {dotClass && <span className={dotClass} />}
//               </button>
//             )
//           })}
//         </div>
//       </div>
//     </>
//   )
// }








/**
 * CreatorCalendar — a self-contained mini-calendar widget for the creator
 * dashboard. Renders one month at a time with prev/next navigation.
 *
 * The calendar maintains its own `viewDate` state (which month is visible)
 * independently from the `selectedDate` prop (controlled by the parent).
 * This lets the user browse months without changing the selected day.
 *
 * Days are rendered as `<button>` elements so keyboard navigation works
 * out of the box. Empty cells (before the 1st) are disabled `<button>`s
 * with `pointer-events: none`.
 *
 * Visual highlights:
 *  - Today → cyan dot below the day number
 *  - Selected → gradient background + cyan border
 *  - Campaign start day → green dot in top-right corner
 *  - Campaign end day → orange dot in top-right corner
 *  - Both start AND end on same day → split-color dot (green + orange)
 *  - Mid-campaign day (active but not start/end) → faded purple dot
 *
 * A legend below the grid is shown only when at least one campaign is
 * present anywhere in `campaignDates`, so the calendar stays clean for
 * creators who don't yet have any accepted campaigns.
 *
 * All styles are inline CSS injected via a `<style>` tag under the `.cr-cal-`
 * namespace to stay consistent with the creator dashboard design system.
 */
'use client'

import { useState, useMemo } from 'react'
import type { CampaignDateMap } from './_actions'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

/**
 * Builds the grid cells for a given month.
 * Leading `null` values represent the empty cells before the 1st of the month
 * (offset determined by `Date.getDay()` of the 1st).
 */
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
  /**
   * Map of YYYY-MM-DD date keys to campaign metadata for that day.
   * If undefined or missing for a given day, no indicator is shown.
   */
  campaignDates?: CampaignDateMap
}

export default function CreatorCalendar({ selectedDate, onSelectDate, campaignDates = {} }: Props) {
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

  /** Builds a YYYY-MM-DD key for a calendar cell day in UTC. */
  const dayKey = (d: number) => {
    const dt = new Date(Date.UTC(viewDate.getFullYear(), viewDate.getMonth(), d))
    return dt.toISOString().slice(0, 10)
  }

  /** Returns campaign info for a day, or null if no campaigns. */
  const getCampaignInfo = (d: number) => {
    const info = campaignDates[dayKey(d)]
    if (!info || info.count === 0) return null
    return info
  }

  /** True if any campaign data exists anywhere — drives whether the legend renders. */
  const hasAnyCampaigns = Object.keys(campaignDates).length > 0

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
        /* Campaign indicators */
        .cr-cal-campaign-dot {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .cr-cal-campaign-dot--start { background: #22c55e; }
        .cr-cal-campaign-dot--end { background: #ff9f4a; }
        .cr-cal-campaign-dot--both {
          background: linear-gradient(135deg, #22c55e 50%, #ff9f4a 50%);
        }
        .cr-cal-campaign-dot--mid { background: rgba(192, 132, 252, 0.7); }
        /* Legend */
        .cr-cal-legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          padding: 8px 12px 12px;
          border-top: 1px solid rgba(0,200,255,0.07);
          font-family: 'Exo 2', sans-serif;
          font-size: 11px;
          color: #4a6080;
        }
        .cr-cal-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .cr-cal-legend-swatch {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
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
          {cells.map((d, i) => {
            const info = d !== null ? getCampaignInfo(d) : null
            let dotClass: string | null = null
            let dotTitle = ''
            if (info) {
              if (info.isStart && info.isEnd) {
                dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--both'
                dotTitle = 'Campaign starts and ends today'
              } else if (info.isStart) {
                dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--start'
                dotTitle = 'Campaign starts today'
              } else if (info.isEnd) {
                dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--end'
                dotTitle = 'Campaign ends today'
              } else {
                dotClass = 'cr-cal-campaign-dot cr-cal-campaign-dot--mid'
                dotTitle = 'Campaign active'
              }
            }

            return (
              <button
                key={i}
                type="button"
                onClick={() => d !== null && handleClick(d)}
                disabled={d === null}
                title={dotTitle || undefined}
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
                {dotClass && <span className={dotClass} />}
              </button>
            )
          })}
        </div>
        {hasAnyCampaigns && (
          <div className="cr-cal-legend">
            <span className="cr-cal-legend-item">
              <span className="cr-cal-legend-swatch" style={{ background: '#22c55e' }} />
              Start
            </span>
            <span className="cr-cal-legend-item">
              <span className="cr-cal-legend-swatch" style={{ background: '#ff9f4a' }} />
              End
            </span>
            <span className="cr-cal-legend-item">
              <span className="cr-cal-legend-swatch" style={{ background: 'linear-gradient(135deg, #22c55e 50%, #ff9f4a 50%)' }} />
              Same day
            </span>
            <span className="cr-cal-legend-item">
              <span className="cr-cal-legend-swatch" style={{ background: 'rgba(192, 132, 252, 0.7)' }} />
              Active
            </span>
          </div>
        )}
      </div>
    </>
  )
}