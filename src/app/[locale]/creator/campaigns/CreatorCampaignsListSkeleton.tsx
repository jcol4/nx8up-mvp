export default function CreatorCampaignsListSkeleton() {
  return (
    <div className="space-y-3.5 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl border border-white/10 bg-white/5" />
      ))}
    </div>
  )
}
