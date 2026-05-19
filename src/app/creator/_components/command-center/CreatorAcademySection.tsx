/**
 * CreatorAcademySection — server component panel that previews a random
 * academy lesson on the creator dashboard each time the page loads.
 *
 * The thumbnail falls back to the YouTube `mqdefault.jpg` image extracted
 * from the lesson's `videoUrl` when a dedicated `thumbnailUrl` is not set.
 *
 * The dot-row progress indicator in the panel header is decorative.
 */
import Link from 'next/link'
import { LESSONS } from '@/lib/academy-lessons'
import Panel from '@/components/shared/Panel'

function getVideoId(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? ''
}

export default function CreatorAcademySection() {
  const featured = LESSONS[Math.floor(Math.random() * LESSONS.length)]
  const videoId = getVideoId(featured.videoUrl)
  const thumbnail = featured.thumbnailUrl ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

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
      <p className="text-xs cr-text-muted uppercase tracking-wider mb-3">Featured lesson</p>
      <Link
        href={`/creator/academy/${featured.id}`}
        className="block rounded-lg cr-border border cr-bg-inner overflow-hidden mb-3 aspect-video relative group"
      >
        <img
          src={thumbnail}
          alt={featured.title}
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
      <p className="text-sm font-medium cr-text-bright">{featured.title}</p>
      <p className="text-xs cr-text-muted mt-0.5">{featured.category}</p>
      <p className="text-xs cr-text-muted mt-1">{featured.duration}</p>
      <Link
        href={`/creator/academy/${featured.id}`}
        className="mt-4 inline-block py-2 px-5 rounded-lg bg-[#00c8ff] text-black text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Explore Academy
      </Link>
    </Panel>
  )
}
