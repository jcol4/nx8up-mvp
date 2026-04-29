import Link from 'next/link'

type NxHudCardProps = {
  title?: string
  href?: string
  linkLabel?: string
  headerRight?: React.ReactNode
  children: React.ReactNode
  className?: string
  as?: 'section' | 'div'
}

export default function NxHudCard({
  title,
  href,
  linkLabel,
  headerRight,
  children,
  className = '',
  as: Component = 'section',
}: NxHudCardProps) {
  return (
    <Component
      className={`glass-panel interactive-panel rounded-xl border border-white/10 border-t-2 border-t-[#99f7ff] p-5 neon-glow-teal ${className}`.trim()}
    >
      {title != null && (
        <div className="mb-4 flex items-center justify-between">
          <div className="mr-4 flex min-w-0 flex-1 items-center gap-3">
            <h2 className="shrink-0 font-headline text-base tracking-[0.24em] text-[#99f7ff] font-semibold">
              {title}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#99f7ff]/55 to-transparent" />
            {href != null && linkLabel != null && (
              <Link href={href} className="text-xs text-[#99f7ff] hover:text-cyan-200 hover:underline">
                {linkLabel}
              </Link>
            )}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </Component>
  )
}
