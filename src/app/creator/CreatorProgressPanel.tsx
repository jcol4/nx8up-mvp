import type { CreatorXpState } from '@/lib/creator-xp'
import type { CalendarTasksMap } from './_actions'
import CreatorCalendarSection from './CreatorCalendarSection'
import ProgressBar from '@/components/ui/ProgressBar'

type Props = {
  xpState: CreatorXpState
  calendarTasks: CalendarTasksMap
}

export default function CreatorProgressPanel({ xpState, calendarTasks }: Props) {
  const { xp, level, xpForNext, rankName } = xpState
  const progressPercent = xpForNext > 0 ? Math.min(100, (xp / xpForNext) * 100) : 0

  return (
    <section className="cr-panel">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🏆</span>
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
    </section>
  )
}
