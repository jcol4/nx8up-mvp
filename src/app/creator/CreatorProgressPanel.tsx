import type { CreatorXpState } from '@/lib/creator-xp'
import type { CalendarTasksMap } from './_actions'
import CreatorCalendarSection from './CreatorCalendarSection'
import Panel from '@/components/shared/Panel'
import ProgressBar from '@/components/ui/ProgressBar'

type Props = {
  xpState: CreatorXpState
  calendarTasks: CalendarTasksMap
}

export default function CreatorProgressPanel({ xpState, calendarTasks }: Props) {
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
      <CreatorCalendarSection calendarTasks={calendarTasks} />
    </Panel>
  )
}
