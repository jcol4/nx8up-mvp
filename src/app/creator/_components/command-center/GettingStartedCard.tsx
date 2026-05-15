import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'

type Props = {
  profileComplete: boolean
  platformConnected: boolean
  appliedToCampaign: boolean
  academyStarted: boolean
}

export default function GettingStartedCard({
  profileComplete,
  platformConnected,
  appliedToCampaign,
  academyStarted,
}: Props) {
  const items = [
    { label: 'Complete your profile', done: profileComplete, href: '/creator/profile' },
    { label: 'Connect Twitch or YouTube', done: platformConnected, href: '/creator/profile' },
    { label: 'Apply to your first campaign', done: appliedToCampaign, href: '/creator/campaigns' },
    { label: 'Check the Academy', done: academyStarted, href: '/creator/academy' },
  ]
  const doneCount = items.filter((i) => i.done).length
  if (doneCount === items.length) return null

  return (
    <div data-reveal className="reveal-item rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] bg-black/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Getting Started</p>
          <p className="mt-1 text-sm text-[#a9abb5]">{doneCount} of {items.length} steps complete</p>
        </div>
        <Link
          href="/creator/guide"
          className="shrink-0 rounded-lg border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-3 py-1.5 text-[11px] uppercase tracking-widest text-[#99f7ff] transition hover:bg-[#99f7ff]/20"
        >
          Full Guide →
        </Link>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#99f7ff] to-[#22c55e]"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5"
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate-600" />
              )}
              <span className={`text-sm ${item.done ? 'text-slate-500 line-through' : 'text-[#c8cad4]'}`}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
