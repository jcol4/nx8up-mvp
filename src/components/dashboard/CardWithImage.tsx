import Link from 'next/link'

type Props = {
  title: string
  imageUrl?: string
  href?: string
  badge?: React.ReactNode
  cornerBadge?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export default function CardWithImage({
  title,
  imageUrl,
  href,
  badge,
  cornerBadge,
  className = '',
  children,
}: Props) {
  const content = (
    <>
      {imageUrl && (
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}
      <div className="relative z-10 p-4 flex flex-col h-full">
        {cornerBadge && (
          <div className="absolute top-3 right-3 z-20">{cornerBadge}</div>
        )}
        {badge && <div className="mb-2">{badge}</div>}
        <span className="text-sm font-medium dash-text-bright">{title}</span>
        {children}
      </div>
    </>
  )

  const wrapperClass = `dash-card-image relative overflow-hidden rounded-lg dash-border border min-h-[100px] ${className}`

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    )
  }

  return <div className={wrapperClass}>{content}</div>
}
