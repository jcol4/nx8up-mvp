'use client'

import { useRouter } from 'next/navigation'
import { addCreatorXp } from './_actions'
import ProgressBar from '@/components/ui/ProgressBar'

// TODO: Replace with actual missions, if steps eg 0/2 make working progress bar
const MISSIONS = [
  { title: 'Complete Brand Package (Media Kit + Rate Card)', xp: 150, progress: 0 },
  { title: 'Post 2x on Twitch this week (0/2)', xp: 100, progress: 1 },
  { title: 'Pitch 5 Local Sponsors for PB Lanes Mission', xp: 120, progress: 1 },
]

export default function CreatorMissionsSection() {
  const router = useRouter()

  const handleClaim = async (xp: number) => {
    const res = await addCreatorXp(xp)
    if (!res.error) router.refresh()
  }

  return (
    <section className="cr-panel">
      <h2 className="cr-panel-title">Today&apos;s Missions</h2>
      <ul className="space-y-3 flex-1">
        {MISSIONS.map((m, i) => (
          <li
            key={i}
            className="p-3 rounded-lg cr-border border cr-bg-inner hover:border-[rgba(0,200,255,0.25)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm cr-text flex-1">{m.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold cr-purple">{m.xp} XP</span>
                <button
                  type="button"
                  onClick={() => handleClaim(m.xp)}
                  className="text-xs px-2 py-0.5 rounded bg-[#00c8ff]/20 text-[#00c8ff] hover:bg-[#00c8ff]/30 font-medium"
                >
                  Claim
                </button>
              </div>
            </div>
            <div className="mt-2">
              <ProgressBar value={m.progress} max={1} variant="purple" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
