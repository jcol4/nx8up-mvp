/**
 * Academy lesson detail page (`/creator/academy/[id]`).
 *
 * Server component: embedded video, numbered steps, module jump links.
 * Uses `CreatorShell` (sidebar + HUD header) to match the rest of the creator app.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getLesson, LESSONS } from '@/lib/academy-lessons'
import CreatorShell from '@/components/creator/CreatorShell'

const CARD =
  'dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 shadow-[0_18px_48px_rgba(0,0,0,0.35)]'

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

  const prev = currentIndex > 0 ? LESSONS[currentIndex - 1] : null
  const next = currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null

  return (
    <CreatorShell>
      <main className="creator-academy creator-academy-detail mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8 md:px-8">
        <nav className="mb-3 text-sm font-medium uppercase tracking-[0.18em] cr-text-muted" aria-label="Breadcrumb">
          <Link
            href="/creator/academy"
            className="text-[#99f7ff] transition-colors hover:text-[#bffcff]"
          >
            ← Academy
          </Link>
          <span className="mx-2 cr-breadcrumb-muted" aria-hidden>
            /
          </span>
          <span className="cr-text-bright">Lesson</span>
        </nav>

        <article className={`${CARD} overflow-hidden`} aria-label="Lesson overview and video">
          <header className="border-b border-white/10 bg-black/30 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <div className="min-w-0 flex-1">
                <p className="cr-field-label">
                  Lesson {currentIndex + 1} of {LESSONS.length}
                </p>
                <h1 className="mt-1 font-headline text-xl font-semibold leading-tight text-[#e8f4ff] sm:text-2xl">
                  {lesson.title}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-0.5 text-nx-10 font-medium text-[#99f7ff]">
                    {lesson.category}
                  </span>
                  <span className="rounded border border-white/25 bg-white/[0.08] px-2 py-0.5 text-nx-10 font-medium text-white">
                    {lesson.duration}
                  </span>
                </div>
              </div>
              <div className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5">
                <p className="mb-2 text-center cr-field-label lg:text-right">
                  Jump to module
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 lg:justify-end" aria-label="Lesson progress">
                  {LESSONS.map((l, i) => (
                    <Link
                      key={l.id}
                      href={`/creator/academy/${l.id}`}
                      title={l.title}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-md border text-nx-11 font-semibold transition-all ${
                        i === currentIndex
                          ? 'border-[#99f7ff]/50 bg-[#99f7ff]/15 text-[#bffcff] shadow-[0_0_16px_-4px_rgba(153,247,255,0.45)]'
                          : 'border-white/15 bg-white/[0.06] text-white hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/10 hover:text-white'
                      }`}
                      aria-current={i === currentIndex ? 'page' : undefined}
                    >
                      {i + 1}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="aspect-video w-full bg-black">
            <iframe
              src={playerVideoUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        </article>

        <section className={`${CARD} mt-6 p-5 sm:p-6`}>
          <h2 className="cr-panel-title">Steps</h2>
          <ol className="mt-5 space-y-6">
            {lesson.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#99f7ff]/40 bg-[#99f7ff]/10 font-headline text-sm font-bold text-[#bffcff] shadow-[0_0_12px_-6px_rgba(153,247,255,0.5)]"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="font-headline text-sm font-semibold text-[#e8f4ff]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed cr-text">{step.description}</p>
                  {step.tips && step.tips.length > 0 && (
                    <ul className="mt-3 space-y-2 border-l-2 border-[#99f7ff]/30 pl-3">
                      {step.tips.map((tip, j) => (
                        <li key={j} className="text-sm leading-relaxed cr-text-muted">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {prev ? (
              <Link
                href={`/creator/academy/${prev.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#e8f4ff] transition hover:border-[#99f7ff]/35 hover:bg-[#99f7ff]/10 hover:text-[#bffcff]"
              >
                ← Previous
              </Link>
            ) : null}
            {next ? (
              <Link
                href={`/creator/academy/${next.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-[#99f7ff]/35 bg-[#99f7ff]/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#bffcff] transition hover:bg-[#99f7ff]/20"
              >
                Next →
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 sm:justify-end">
            <Link
              href="/creator/academy"
              className="inline-flex items-center justify-center rounded-lg border border-white/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#99f7ff] transition hover:border-[#99f7ff]/40 hover:bg-[#99f7ff]/10"
            >
              All lessons
            </Link>
            <Link
              href="/creator"
              className="inline-flex items-center justify-center rounded-lg bg-[#99f7ff] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0f172a] transition hover:brightness-110"
            >
              Dashboard
            </Link>
          </div>
        </footer>
      </main>
    </CreatorShell>
  )
}
