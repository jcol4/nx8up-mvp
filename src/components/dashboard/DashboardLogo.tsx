/** DashboardLogo — Logo locked to "md" size for consistent dashboard header height. */
import Logo from '@/components/shared/Logo'

type Props = { href?: string; className?: string }

export default function DashboardLogo({ href = '/', className = '' }: Props) {
  return <Logo href={href} size="md" className={className} />
}