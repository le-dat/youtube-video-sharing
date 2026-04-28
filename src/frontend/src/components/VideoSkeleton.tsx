export function VideoSkeleton() {
  return (
    <div className="bg-surface border-3 border-text-primary shadow-neo animate-pulse">
      <div className="aspect-video bg-text-secondary/20" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-text-secondary/20 w-full rounded" />
        <div className="h-5 bg-text-secondary/20 w-2/3 rounded" />
        <div className="h-4 bg-text-secondary/10 w-1/2 rounded mt-2" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 bg-text-secondary/10 w-20 rounded" />
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-text-secondary/10 border-3 border-text-primary/20" />
            <div className="w-10 h-10 bg-text-secondary/10 border-3 border-text-primary/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VideoSkeleton key={i} />
      ))}
    </div>
  );
}
