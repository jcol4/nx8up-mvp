'use client'

import * as React from 'react'

/** Month 1–12 → days in that month */
function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate()
}

const MONTHS: { value: string; label: string }[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

type Props = {
  /** Form field name for ISO date YYYY-MM-DD */
  name: string
  /** Earliest selectable calendar date (YYYY-MM-DD) */
  min?: string
  /** Latest selectable calendar date (YYYY-MM-DD) */
  max?: string
}

/**
 * Birth date as three dropdowns (year → month → day). Faster than a calendar
 * for picking a birth year and avoids popup/stacking issues.
 */
export default function BirthdateSelect({ name, min, max }: Props) {
  const bounds = React.useMemo(() => {
    const maxD = max ? new Date(max + 'T12:00:00') : new Date()
    const minD = min ? new Date(min + 'T12:00:00') : new Date(maxD.getFullYear() - 120, 0, 1)
    maxD.setHours(0, 0, 0, 0)
    minD.setHours(0, 0, 0, 0)
    return { maxD, minD }
  }, [min, max])

  const yearMax = bounds.maxD.getFullYear()
  const yearMin = bounds.minD.getFullYear()

  const years = React.useMemo(
    () =>
      Array.from({ length: yearMax - yearMin + 1 }, (_, i) => String(yearMax - i)),
    [yearMax, yearMin],
  )

  const [year, setYear] = React.useState('')
  const [month, setMonth] = React.useState('')
  const [day, setDay] = React.useState('')

  const yNum = year ? parseInt(year, 10) : NaN
  const mNum = month ? parseInt(month, 10) : NaN

  const maxDay =
    Number.isFinite(yNum) && Number.isFinite(mNum) ? daysInMonth(yNum, mNum) : 31

  React.useEffect(() => {
    if (!day) return
    const dNum = parseInt(day, 10)
    if (dNum > maxDay) setDay(String(maxDay))
  }, [month, year, maxDay, day])

  const iso = React.useMemo(() => {
    if (!month || !day || !year) return ''
    const dNum = parseInt(day, 10)
    const mNum = parseInt(month, 10)
    const yNum = parseInt(year, 10)
    if (!Number.isFinite(dNum) || !Number.isFinite(mNum) || !Number.isFinite(yNum)) return ''
    if (dNum < 1 || dNum > daysInMonth(yNum, mNum)) return ''
    const candidate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const dt = new Date(candidate + 'T12:00:00')
    if (dt < bounds.minD || dt > bounds.maxD) return ''
    return candidate
  }, [month, day, year, bounds])

  const labelClass = 'nx-label mb-2 block'

  return (
    <>
      <input type="hidden" name={name} value={iso} />
      <div className="rounded-xl border border-white/[0.08] bg-[rgb(0_0_0_/0.2)] p-3 sm:p-4">
      {/* Always one column: three-up grids make each <select> too narrow; closed option text clips (“Sele”) */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col">
          <span className={labelClass}>Year</span>
          <select
            className="nx-input nx-select"
            value={year}
            onChange={(e) => {
              setYear(e.target.value)
              setMonth('')
              setDay('')
            }}
            aria-label="Birth year"
          >
            <option value="">Select</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <span className={labelClass}>Month</span>
          <select
            className="nx-input nx-select"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value)
              setDay('')
            }}
            disabled={!year}
            aria-label="Birth month"
          >
            <option value="">Select</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <span className={labelClass}>Day</span>
          <select
            className="nx-input nx-select"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={!month || !year}
            aria-label="Birth day"
          >
            <option value="">Select</option>
            {month &&
              year &&
              Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
          </select>
        </div>
      </div>
      </div>
    </>
  )
}
