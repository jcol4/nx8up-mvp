/**
 * CreatorAcademySection — server component panel that previews the first
 * academy lesson on the creator dashboard.
 *
 * Always shows `LESSONS[0]` as the "Next module" regardless of which lessons
 * the creator has already completed (lesson progress tracking is not yet
 * implemented).
 *
 * The thumbnail falls back to the YouTube `mqdefault.jpg` image extracted
 * from the lesson's `videoUrl` when a dedicated `thumbnailUrl` is not set.
 *
 * The dot-row progress indicator in the panel header is decorative — only the
 * first dot is highlighted (index 0 = current lesson is always lesson 1).
 */
import Link from 'next/link'
import { LESSONS } from '@/lib/academy-lessons'
import Panel from '@/components/shared/Panel'

const NEXT_LESSON = LESSONS[0]
const MR_FRUIT_PREVIEW = {
  videoId: 'K5qh58o5A-M',
  title: 'Mr. Fruit Feature Lesson',
  category: 'Gaming / Creator',
  durationMinutes: '12',
}

export default function CreatorAcademySection() {
  return (
    <Panel
      variant="creator"
      title="Academy"
      href="/creator/academy"
      linkLabel="View all"
      className="glass-panel interactive-panel neon-glow-purple"
      headerRight={
        <div className="flex gap-1.5" aria-label="Lesson progress">
          {LESSONS.map((_, i) => (
            <span
              key={i}
              className={`block w-2 h-2 rounded-full transition-colors ${
                i === 0 ? 'bg-[#00c8ff]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      }
    >
      <p className="text-xs cr-text-muted uppercase tracking-wider mb-3">Next module</p>
      <Link
        href={`/creator/academy/${NEXT_LESSON.id}`}
        className="block rounded-lg cr-border border cr-bg-inner overflow-hidden mb-3 aspect-video relative group"
      >
        <img
          src={`https://img.youtube.com/vi/${MR_FRUIT_PREVIEW.videoId}/mqdefault.jpg`}
          alt={MR_FRUIT_PREVIEW.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
              <path d="M2 1.5l12 7.5-12 7.5V1.5z" fill="#000"/>
            </svg>
          </span>
        </div>
      </Link>
      <p className="text-sm font-medium cr-text-bright">{MR_FRUIT_PREVIEW.title}</p>
      <p className="text-xs cr-text-muted mt-0.5">{MR_FRUIT_PREVIEW.category}</p>
      <p className="text-xs cr-text-muted mt-1">0/{MR_FRUIT_PREVIEW.durationMinutes} min</p>
      <Link
        href={`/creator/academy/${NEXT_LESSON.id}`}
        className="mt-4 inline-block py-2 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Begin Module
      </Link>
    </Panel>
  )
}
