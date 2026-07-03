'use client'

import Panel from '@/components/shared/Panel'
import ProgressBar from '@/components/ui/ProgressBar'

type MissionItem = {
  id: string
  missionId: string
  title: string
  xp: number
  type: string
  completed: boolean
}

type Props = {
  missions: MissionItem[]
}

export default function CreatorMissionsSection({ missions }: Props) {
  return (
    <Panel variant="creator" title="Active Objectives" className="glass-panel interactive-panel neon-glow-purple">
      {missions.length === 0 ? (
        <p className="text-sm cr-text italic opacity-60">No missions assigned yet.</p>
      ) : (
        <ul className="space-y-3 flex-1">
          {missions.map((m) => (
            <li
              key={m.id}
              className="p-3 rounded-lg cr-border border cr-bg-inner hover:border-[rgba(153,247,255,0.35)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-sm flex-1 text-[#c8cad4] ${m.completed ? 'line-through opacity-50' : ''}`}>{m.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold cr-purple">{m.xp} XP</span>
                  {m.completed && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] font-medium">Done</span>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <ProgressBar value={m.completed ? 1 : 0} max={1} variant="purple" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
