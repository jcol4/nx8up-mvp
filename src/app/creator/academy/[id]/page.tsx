/**
 * Academy lesson detail page (`/creator/academy/[id]`).
 *
 * Server component that renders an individual academy lesson, including:
 *  - An embedded YouTube (or other) video via an `<iframe>`.
 *  - A numbered step-by-step guide with optional tip bullets.
 *  - A dot-row progress indicator in the panel header, where each dot is a
 *    clickable link to that lesson; the current lesson's dot is highlighted.
 *
 * Calls `notFound()` when the `id` param does not match any lesson in
 * `LESSONS`. No XP is awarded here — that requires a separate "complete"
 * action (not yet implemented on this page).
 *
 * `params` is a `Promise<{ id: string }>` as required by the Next.js 15
 * App Router dynamic params API.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLesson, LESSONS } from '@/lib/academy-lessons'
import CreatorTopBar from '@/components/creator/CreatorTopBar'
import Panel from '@/components/shared/Panel'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AcademyLessonPage({ params }: Props) {
  const { id } = await params
  const lesson = getLesson(id)
  if (!lesson) notFound()

  const currentIndex = LESSONS.findIndex((l) => l.id === id)
  const playerVideoUrl =
    lesson.id === 'media-kit' ? 'https://www.youtube.com/embed/K5qh58o5A-M' : lesson.videoUrl

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
        <Panel
          variant="creator"
          as="div"
          title={lesson.title}
          titleLevel={1}
          headerRight={
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
          }
        >
          <p className="text-xs cr-accent mb-4">+ {lesson.category} · {lesson.xpReward} XP</p>

          {/* Video */}
          <div className="rounded-lg cr-border border cr-bg-inner overflow-hidden mb-8 aspect-video">
            <iframe
              src={playerVideoUrl}
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
        </Panel>
      </main>
    </>
  )
}
