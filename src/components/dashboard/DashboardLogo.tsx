import Logo from '@/components/shared/Logo'

type Props = {
  href?: string
  className?: string
}

export default function DashboardLogo({ href = '/', className = '' }: Props) {
  return <Logo href={href} variant="admin" className={className} />
}
