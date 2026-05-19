import Link from 'next/link'
import { DashboardPanel } from '@/components/dashboard'
import { LESSONS } from '@/lib/academy-lessons'

function getVideoId(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? ''
}

function lessonThumbnailUrl(lesson: (typeof LESSONS)[number]) {
  return lesson.thumbnailUrl ?? `https://img.youtube.com/vi/${getVideoId(lesson.videoUrl)}/mqdefault.jpg`
}

/** First lessons shown in the admin dashboard preview; full catalog via “View all”. */
const PREVIEW_COUNT = 3

export default function AdminCreatorAcademy() {
  const preview = LESSONS.slice(0, PREVIEW_COUNT)

  return (
    <DashboardPanel title="Creator Academy" href="/admin/academy" linkLabel="View all">
      <div className="space-y-2">
        {preview.map((lesson, idx) => (
          <Link
            key={lesson.id}
            href={`/creator/academy/${lesson.id}`}
            className="group block rounded-lg border border-white/10 bg-black/20 p-2.5 transition-colors hover:border-[#99f7ff]/30 sm:p-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-[52px] w-[92px] shrink-0 overflow-hidden rounded-md border border-white/12 bg-black/40 shadow-[0_6px_14px_rgba(0,0,0,0.35)]">
                <img
                  src={lessonThumbnailUrl(lesson)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
                      <path d="M0 0v12l10-6L0 0Z" fill="#0a0a12" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                  {lesson.title}
                </p>
                <p className="mt-0.5 text-nx-11 font-medium text-[#99f7ff]/85">
                  {lesson.category}
                  <span className="text-white/25"> · </span>
                  <span className="tabular-nums text-white/75">{lesson.duration}</span>
                </p>
              </div>
              <span className="shrink-0 rounded border border-white/15 bg-white/[0.04] px-2 py-0.5 text-nx-10 font-medium text-white/85">
                Lesson {idx + 1}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </DashboardPanel>
  )
}
