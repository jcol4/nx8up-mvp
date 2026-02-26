type Props = {
  label: string
  value: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export default function InsightRow({ label, value, icon }: Props) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        {icon && <span className="dash-insight-icon">{icon}</span>}
        <span className="text-sm dash-text-muted">{label}</span>
      </div>
      <span className="text-sm font-semibold dash-text-bright">{value}</span>
    </div>
  )
}
