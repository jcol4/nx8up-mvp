import Link from 'next/link'

type Props = {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
}

export default function DashboardPanel({ title, href, linkLabel, children, className = '' }: Props) {
  return (
    <section className={`dash-panel flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="dash-panel-title">{title}</h2>
        {href && linkLabel && (
          <Link href={href} className="text-xs dash-accent hover:underline">
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
