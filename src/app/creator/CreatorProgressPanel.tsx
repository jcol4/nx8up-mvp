// /**
//  * CreatorProgressPanel — server component panel that shows the creator's
//  * current XP / level progress and embeds the interactive calendar.
//  *
//  * The XP progress bar uses `xp / xpForNext` to calculate the fill percentage,
//  * clamped to 100 to prevent overflow on edge cases.
//  *
//  * `CreatorCalendarSection` is rendered as a client-component island within
//  * this server component; the full `calendarTasks` map is passed as a prop to
//  * avoid an extra client-side fetch.
//  */
// import type { CreatorXpState } from '@/lib/creator-xp'
// import type { CalendarTasksMap } from './_actions'
// import CreatorCalendarSection from './CreatorCalendarSection'
// import Panel from '@/components/shared/Panel'
// import ProgressBar from '@/components/ui/ProgressBar'

// type Props = {
//   xpState: CreatorXpState
//   calendarTasks: CalendarTasksMap
// }

// export default function CreatorProgressPanel({ xpState, calendarTasks }: Props) {
//   const { xp, level, xpForNext, rankName } = xpState
//   const progressPercent = xpForNext > 0 ? Math.min(100, (xp / xpForNext) * 100) : 0

//   return (
//     <Panel variant="creator">
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-8 h-8 rounded flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
//           <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//             <path d="M7 1l1.5 3.5H12L9.5 7l1 3.5L7 8.5 3.5 10.5l1-3.5L2 4.5h3.5z" stroke="#00c8ff" strokeWidth="1.2" strokeLinejoin="round"/>
//           </svg>
//         </div>
//         <div>
//           <p className="text-sm font-medium cr-text-bright">
//             {xp} / {xpForNext}
//           </p>
//           <p className="text-xs cr-text-muted">
//             Level {level} — {rankName}
//           </p>
//         </div>
//       </div>
//       <div className="mb-4">
//         <ProgressBar value={xp} max={xpForNext} variant="gradient" height="md" />
//       </div>
//       <p className="text-xs cr-text-muted mb-3 uppercase tracking-wider">
//         Progress this week
//       </p>
//       <CreatorCalendarSection calendarTasks={calendarTasks} />
//     </Panel>
//   )
// }









/**
 * CreatorProgressPanel — server component panel that shows the creator's
 * current XP / level progress and embeds the interactive calendar.
 *
 * The XP progress bar uses `xp / xpForNext` to calculate the fill percentage,
 * clamped to 100 to prevent overflow on edge cases.
 *
 * `CreatorCalendarSection` is rendered as a client-component island within
 * this server component; the `calendarTasks` map and `campaignDates` map
 * are passed as props to avoid extra client-side fetches.
 */
import type { CreatorXpState } from '@/lib/creator-xp'
import type { CalendarTasksMap, CampaignDateMap } from './_actions'
import CreatorCalendarSection from './CreatorCalendarSection'
import Panel from '@/components/shared/Panel'
import ProgressBar from '@/components/ui/ProgressBar'

type Props = {
  xpState: CreatorXpState
  calendarTasks: CalendarTasksMap
  campaignDates: CampaignDateMap
}

export default function CreatorProgressPanel({ xpState, calendarTasks, campaignDates }: Props) {
  const { xp, level, xpForNext, rankName } = xpState
  const progressPercent = xpForNext > 0 ? Math.min(100, (xp / xpForNext) * 100) : 0

  return (
    <Panel variant="creator">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.5 3.5H12L9.5 7l1 3.5L7 8.5 3.5 10.5l1-3.5L2 4.5h3.5z" stroke="#00c8ff" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium cr-text-bright">
            {xp} / {xpForNext}
          </p>
          <p className="text-xs cr-text-muted">
            Level {level} — {rankName}
          </p>
        </div>
      </div>
      <div className="mb-4">
        <ProgressBar value={xp} max={xpForNext} variant="gradient" height="md" />
      </div>
      <p className="text-xs cr-text-muted mb-3 uppercase tracking-wider">
        Progress this week
      </p>
      <CreatorCalendarSection calendarTasks={calendarTasks} campaignDates={campaignDates} />
    </Panel>
  )
}