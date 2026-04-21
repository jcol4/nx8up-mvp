/** Logo — nx8up logo image wrapped in a Next.js Link. Three size presets: sm/md/lg. */
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 28, md: 40, lg: 56 }

export default function Logo({ href = '/', size = 'md', className = '' }: Props) {
  const px = sizes[size]
  return (
    <Link href={href} className={className}>
      <Image
        src="/nx8up_logo_transparent.png"
        alt="nx8up"
        width={px}
        height={px}
        priority
      />
    </Link>
  )
}