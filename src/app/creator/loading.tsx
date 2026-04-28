export default function CreatorLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 w-56 rounded-lg bg-white/10" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="h-48 rounded-xl bg-white/10 xl:col-span-2" />
        <div className="h-48 rounded-xl bg-white/10" />
      </div>
    </div>
  )
}
