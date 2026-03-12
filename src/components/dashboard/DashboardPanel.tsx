import Panel from '@/components/shared/Panel'

type Props = {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
}

export default function DashboardPanel({ title, href, linkLabel, children, className = '' }: Props) {
  return (
    <Panel variant="dashboard" title={title} href={href} linkLabel={linkLabel} className={className}>
      {children}
    </Panel>
  )
}
