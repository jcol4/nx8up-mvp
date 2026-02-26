import Link from 'next/link'
import { LESSONS } from '@/lib/academy-lessons'
import CreatorTopBar from '@/components/creator/CreatorTopBar'

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
        <div className="cr-panel">
          <h1 className="cr-panel-title">Academy</h1>
          <p className="text-sm cr-text-muted mb-6">
            Step-by-step lessons to grow your creator business.
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
                    <p className="text-xs cr-text-muted mt-0.5">+ {lesson.category} · {lesson.duration}</p>
                  </div>
                  <span className="text-xs cr-accent self-center">Start →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
