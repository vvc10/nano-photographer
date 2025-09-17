export function MasonrySkeleton({ items = 12 }: { items?: number }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-4 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <div className="h-64 rounded-2xl bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  )
}
