export default function AdminLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-white/10" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
        <div className="h-24 rounded-xl bg-white/10" />
      </div>
      <div className="h-72 rounded-xl bg-white/10" />
    </div>
  )
}
