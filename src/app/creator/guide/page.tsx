import Link from 'next/link'
import CreatorShell from '@/components/creator/CreatorShell'
import GuideContent from './GuideContent'

export default function CreatorGuidePage() {
  return (
    <CreatorShell>
      <div className="mx-auto max-w-5xl p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="font-headline text-[11px] uppercase tracking-[0.2em] text-[#99f7ff]">Creator</p>
            <h1 className="mt-1 font-headline text-xl font-semibold text-[#e8f4ff]">Creator Guide</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#a9abb5]">
              Everything you need to know about using nx8up as a creator.
            </p>
          </div>
          <Link
            href="/creator"
            className="shrink-0 text-sm text-[#a9abb5] transition-colors hover:text-[#99f7ff]"
          >
            ← Dashboard
          </Link>
        </div>

        <GuideContent />
      </div>
    </CreatorShell>
  )
}
