import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLesson, LESSONS } from '@/lib/academy-lessons'
import CreatorTopBar from '@/components/creator/CreatorTopBar'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AcademyLessonPage({ params }: Props) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) notFound()

  const currentIndex = LESSONS.findIndex((l) => l.id === id)

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
          <div className="flex items-center justify-between mb-4">
            <h1 className="cr-panel-title mb-0">{lesson.title}</h1>
            <div className="flex gap-1.5" aria-label="Lesson progress">
              {LESSONS.map((_, i) => (
                <Link
                  key={LESSONS[i].id}
                  href={`/creator/academy/${LESSONS[i].id}`}
                  className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-[#00c8ff] ring-2 ring-[#00c8ff]/50' : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-current={i === currentIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
          <p className="text-xs cr-accent mb-4">+ {lesson.category} · {lesson.xpReward} XP</p>

          {/* Video */}
          <div className="rounded-lg cr-border border cr-bg-inner overflow-hidden mb-8 aspect-video">
            <iframe
              src={lesson.videoUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Step-by-step */}
          <h2 className="text-sm font-semibold cr-text-bright uppercase tracking-wider mb-4">
            Steps
          </h2>
          <ol className="space-y-6">
            {lesson.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00c8ff]/20 border border-[#00c8ff]/50 flex items-center justify-center text-sm font-bold cr-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold cr-text-bright mb-1">{step.title}</h3>
                  <p className="text-sm cr-text-muted">{step.description}</p>
                  {step.tips && step.tips.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {step.tips.map((tip, j) => (
                        <li key={j} className="text-xs cr-text-muted flex items-start gap-2">
                          <span className="cr-accent mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 pt-6 border-t cr-border">
            <Link
              href="/creator"
              className="inline-block py-2 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
