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
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { auth } from '@clerk/nextjs/server'
import { LESSONS } from '@/lib/academy-lessons'
import { getUserDisplayInfo } from '@/lib/get-user-display-info'
import CreatorShell from '@/components/creator/CreatorShell'

/**
 * Extracts the YouTube video ID from an embed or watch URL.
 * e.g. `https://www.youtube.com/embed/abc123` → `"abc123"`
 */
function getVideoId(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? ''
}

export default function AcademyPage() {
  return <AcademyPageInner />
}

async function AcademyPageInner() {
  const t = await getTranslations('creator.academy')
  const [{ sessionClaims }, { displayName, username }] = await Promise.all([auth(), getUserDisplayInfo()])
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

  return (
    <CreatorShell>
      <main className="creator-academy mx-auto max-w-5xl p-6 sm:p-8">
        <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-headline text-nx-11 uppercase tracking-[0.2em] text-[#99f7ff]">{t('heading')}</p>
          <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">{t('title')}</h1>
          <p className="mt-1 text-sm cr-text-muted">
            {t('subtitle')}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-[#99f7ff]/25 bg-[#99f7ff]/10 px-2.5 py-1 text-nx-11 text-[#99f7ff]">
            {t('lessonCount', { n: LESSONS.length })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {LESSONS.map((lesson, i) => (
            <Link
              key={lesson.id}
              href={`/creator/academy/${lesson.id}`}
              className="group dash-panel dash-panel--nx-top rounded-xl border border-white/16 border-t-2 border-t-[#bffcff] bg-black/20 p-4 transition-colors hover:border-[#99f7ff]/35 hover:bg-black/25"
              style={{ borderTopWidth: '2px', borderTopColor: '#bffcff' }}
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-28 overflow-hidden rounded-lg border border-white/12 bg-black/30 shadow-[0_10px_20px_rgba(0,0,0,0.35)]">
                  <img
                    src={lesson.thumbnailUrl ?? `https://img.youtube.com/vi/${getVideoId(lesson.videoUrl)}/mqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded border border-[#99f7ff]/30 bg-[#99f7ff]/10 px-2 py-0.5 text-nx-10 font-medium text-[#99f7ff]">
                      {t('lessonBadge', { n: i + 1 })}
                    </span>
                    <span className="rounded border border-[#c084fc]/30 bg-[#c084fc]/10 px-2 py-0.5 text-nx-10 text-[#d8b4fe]">
                      {lesson.category}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold text-[#e8f4ff] group-hover:text-[#f4fdff]">
                    {lesson.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm cr-text-muted">{lesson.duration}</span>
                    <span className="text-xs font-medium text-[#99f7ff] transition-colors group-hover:text-[#c9fbff]">
                      {t('openLesson')}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </CreatorShell>
  )
}
