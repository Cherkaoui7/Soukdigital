export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-[4/5] shimmer-souk" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-2.5 w-1/3 rounded-full shimmer-souk" />
        <div className="h-4 w-4/5 rounded-full shimmer-souk" />
        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="h-5 w-20 rounded-full shimmer-souk" />
          <div className="h-9 w-9 rounded-full shimmer-souk" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 h-12 w-12 rounded-xl shimmer-souk" />
      <div className="h-4 w-2/3 rounded-full shimmer-souk" />
      <div className="mt-2 h-2.5 w-1/3 rounded-full shimmer-souk" />
    </div>
  );
}
