import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'

const LESSON_PROGRESS = [
  { title: 'Sponsorship Basics', completion: 100, tone: 'text-[#22c55e]' },
  { title: 'Optimize Your Content', completion: 72, tone: 'text-[#99f7ff]' },
  { title: 'Mastering Social Media', completion: 45, tone: 'text-[#a855f7]' },
]

export default function AdminCreatorAcademy() {
  return (
    <DashboardPanel title="Creator Academy" href="/admin/academy" linkLabel="View all">
      <div className="space-y-2">
        {LESSON_PROGRESS.map((lesson, idx) => (
          <Link
            key={lesson.title}
            href="/admin/academy"
            className="block rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:border-[#99f7ff]/30"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm dash-text-bright">{lesson.title}</p>
                <p className="mt-0.5 text-[11px] dash-text-muted">
                  {lesson.completion >= 100
                    ? 'Completed'
                    : lesson.completion >= 70
                      ? 'In progress'
                      : 'Needs attention'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-[#a9abb5]">
                  Lesson {idx + 1}
                </span>
                <span className={`text-xs font-medium ${lesson.tone}`}>{lesson.completion}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  )
}
