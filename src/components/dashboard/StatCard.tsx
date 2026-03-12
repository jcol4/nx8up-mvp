type Props = {
  label: string
  value: React.ReactNode
  className?: string
}

export default function StatCard({ label, value, className = '' }: Props) {
  return (
    <div className={`dash-stat ${className}`}>
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value">{value}</div>
    </div>
  )
}
