'use client'

import { useState } from 'react'
import CreatorCalendar from './CreatorCalendar'
import CreatorDayTasks from './CreatorDayTasks'
import type { CalendarTasksMap } from './_actions'

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

type Props = {
  calendarTasks: CalendarTasksMap
}

export default function CreatorCalendarSection({ calendarTasks }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const dateKey = toDateKey(selectedDate)
  const tasks = calendarTasks[dateKey] ?? []

  return (
    <>
      <CreatorCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <CreatorDayTasks
        dateKey={dateKey}
        selectedDate={selectedDate}
        tasks={tasks}
      />
    </>
  )
}
