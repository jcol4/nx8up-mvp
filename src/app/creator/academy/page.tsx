/**
 * Academy listing page (`/creator/academy`).
 *
 * Server component that renders a scrollable list of all academy lessons
 * sourced from the static `LESSONS` array in `@/lib/academy-lessons`.
 * Each lesson card links to its individual lesson page.
 *
 * Lesson progress / completion state is not tracked — all lessons appear
 * the same regardless of whether the creator has viewed them.
 *
 * Thumbnail images fall back to the YouTube `mqdefault.jpg` format derived
 * from `getVideoId(lesson.videoUrl)` when no `thumbnailUrl` is set.
 */
import Link from 'next/link'
import { LESSONS } from '@/lib/academy-lessons'
import CreatorTopBar from '@/components/creator/CreatorTopBar'
import Panel from '@/components/shared/Panel'

/**
 * Extracts the YouTube video ID from an embed or watch URL.
 * e.g. `https://www.youtube.com/embed/abc123` → `"abc123"`
 */
function getVideoId(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? ''
}

export default function AcademyPage() {
  return (
    <>
      <CreatorTopBar
        rightContent={
          <Link
            href="/creator"
            className="text-sm cr-text-muted hover:text-[#c8dff0] transition-colors"
          >
            ← Dashboard
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto p-6 sm:p-8">
        <Panel variant="creator" as="div" title="Academy" titleLevel={1}>
          <p className="text-sm cr-text-muted mb-6">
            Structured modules to develop your creator business.
          </p>
          <div className="space-y-4">
            {LESSONS.map((lesson, i) => (
              <Link
                key={lesson.id}
                href={`/creator/academy/${lesson.id}`}
                className="block p-4 rounded-lg cr-border border cr-bg-inner hover:border-[rgba(0,200,255,0.3)] transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-14 rounded cr-border border overflow-hidden flex-shrink-0">
                    <img
                      src={lesson.thumbnailUrl ?? `https://img.youtube.com/vi/${getVideoId(lesson.videoUrl)}/mqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium cr-text-bright">{lesson.title}</p>
                    <p className="text-xs cr-text-muted mt-0.5">{lesson.category} · {lesson.duration}</p>
                  </div>
                  <span className="text-xs cr-text-muted self-center">View</span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </main>
    </>
  )
}
