// /**
//  * CreatorCalendarSection — client component that composes the mini-calendar
//  * and the day-tasks list into a single interactive unit.
//  *
//  * Owns the `selectedDate` state so that both sub-components stay in sync:
//  * clicking a day in `CreatorCalendar` updates the state here, which causes
//  * `CreatorDayTasks` to display the tasks for the newly selected date.
//  *
//  * Receives the full `CalendarTasksMap` (loaded server-side) as a prop so
//  * that the task list renders immediately without a client-side fetch.
//  */
// 'use client'

// import { useState } from 'react'
// import CreatorCalendar from './CreatorCalendar'
// import CreatorDayTasks from './CreatorDayTasks'
// import type { CalendarTasksMap } from './_actions'

// function toDateKey(d: Date): string {
//   return d.toISOString().slice(0, 10)
// }

// type Props = {
//   calendarTasks: CalendarTasksMap
// }

// export default function CreatorCalendarSection({ calendarTasks }: Props) {
//   const [selectedDate, setSelectedDate] = useState(() => new Date())
//   const dateKey = toDateKey(selectedDate)
//   const tasks = calendarTasks[dateKey] ?? []

//   return (
//     <>
//       <CreatorCalendar
//         selectedDate={selectedDate}
//         onSelectDate={setSelectedDate}
//       />
//       <CreatorDayTasks
//         dateKey={dateKey}
//         selectedDate={selectedDate}
//         tasks={tasks}
//       />
//     </>
//   )
// }








/**
 * CreatorCalendarSection — client component that composes the mini-calendar
 * and the day-tasks list into a single interactive unit.
 *
 * Owns the `selectedDate` state so that both sub-components stay in sync:
 * clicking a day in `CreatorCalendar` updates the state here, which causes
 * `CreatorDayTasks` to display the tasks for the newly selected date.
 *
 * Receives the full `CalendarTasksMap` and `CampaignDateMap` (both loaded
 * server-side) as props so that the task list and calendar visuals render
 * immediately without any client-side fetch.
 */
'use client'

import { useState } from 'react'
import CreatorCalendar from './CreatorCalendar'
import CreatorDayTasks from './CreatorDayTasks'
import type { CalendarTasksMap, CampaignDateMap } from './_actions'

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

type Props = {
  calendarTasks: CalendarTasksMap
  campaignDates: CampaignDateMap
}

export default function CreatorCalendarSection({ calendarTasks, campaignDates }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const dateKey = toDateKey(selectedDate)
  const tasks = calendarTasks[dateKey] ?? []

  return (
    <>
      <CreatorCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        campaignDates={campaignDates}
      />
      <CreatorDayTasks
        dateKey={dateKey}
        selectedDate={selectedDate}
        tasks={tasks}
      />
    </>
  )
}