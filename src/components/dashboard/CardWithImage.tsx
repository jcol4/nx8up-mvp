/**
 * CardWithImage — dashboard card with optional background image, gradient overlay, and badge slots.
 * Renders as a <Link> when href is provided, otherwise as a plain <div>.
 * NOTE: Uses native <img> instead of Next.js <Image> — bypasses optimization and lazy loading.
 */
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  title: string
  /** URL for the background image. Rendered at 60% opacity with a bottom-to-top gradient overlay. */
  imageUrl?: string
  /** When provided, the entire card becomes a Next.js Link. */
  href?: string
  /** Badge rendered in the top-left of the card content area. */
  badge?: React.ReactNode
  /** Badge pinned to the top-right corner (absolute position, z-20). */
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
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover opacity-60"
            sizes="(max-width: 768px) 100vw, 400px"
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
