import Link from 'next/link'
import { LESSONS } from '@/lib/academy-lessons'

const NEXT_LESSON = LESSONS[0]

export default function CreatorAcademySection() {
  return (
    <section className="cr-panel">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="cr-panel-title mb-0">Academy</h2>
          <Link href="/creator/academy" className="text-xs cr-accent hover:underline">
            View all
          </Link>
        </div>
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
      </div>
      <p className="text-xs cr-accent uppercase tracking-wider mb-3">Next lesson</p>
      <Link
        href={`/creator/academy/${NEXT_LESSON.id}`}
        className="block rounded-lg cr-border border cr-bg-inner overflow-hidden mb-3 aspect-video relative group"
      >
        <img
          src={NEXT_LESSON.thumbnailUrl ?? `https://img.youtube.com/vi/${NEXT_LESSON.videoUrl.split('/').pop()?.split('?')[0] ?? ''}/mqdefault.jpg`}
          alt={NEXT_LESSON.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
          <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center text-2xl text-black ml-1 group-hover:scale-110 transition-transform">
            ▶
          </span>
        </div>
      </Link>
      <p className="text-sm font-medium cr-text-bright">{NEXT_LESSON.title}</p>
      <p className="text-xs cr-text-muted mt-0.5">+ {NEXT_LESSON.category}</p>
      <p className="text-xs cr-text-muted mt-1">0/{NEXT_LESSON.duration.replace(' min', '')} min</p>
      <Link
        href={`/creator/academy/${NEXT_LESSON.id}`}
        className="mt-4 inline-block py-2 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Start
      </Link>
    </section>
  )
}
