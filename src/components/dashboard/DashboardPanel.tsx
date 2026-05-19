import NxHudCard from '@/components/nx-shell/NxHudCard'

type Props = {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
  titleClassName?: string
}

export default function DashboardPanel({ title, href, linkLabel, children, className = '', titleClassName }: Props) {
  return (
    <NxHudCard title={title} href={href} linkLabel={linkLabel} className={className} titleClassName={titleClassName}>
      {children}
    </NxHudCard>
  )
}
