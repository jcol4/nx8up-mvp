type CollapsibleSectionProps = {
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className="group rounded-lg border border-white/10 bg-black/10 open:bg-black/20"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 select-none">
        <div className="min-w-0">
          <span className="cr-panel-title !mb-0">{title}</span>
          {description && <p className="mt-0.5 text-xs cr-text-muted">{description}</p>}
        </div>
        <svg
          className="h-4 w-4 shrink-0 text-[#99f7ff] transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}
