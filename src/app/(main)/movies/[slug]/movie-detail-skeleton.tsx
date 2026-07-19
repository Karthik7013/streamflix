import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS_4 = Array.from({ length: 4 }, (_, i) => i);

export function MovieDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[40vh] sm:h-[55vh] md:h-[70vh] lg:h-[85vh] min-h-125 w-full overflow-hidden mb-16 bg-muted">
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 z-20">
          <Skeleton className="size-10 rounded-full" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12 lg:p-16">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-1" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-1" />
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="h-5 w-10 rounded" />
            </div>
            <Skeleton className="h-9 sm:h-10 md:h-14 lg:h-16 w-3/4 sm:w-2/3 md:w-3/5" />
            <div className="space-y-2">
              <Skeleton className="h-3 sm:h-3.5 md:h-4 w-full max-w-xl" />
              <Skeleton className="h-3 sm:h-3.5 md:h-4 w-4/5 max-w-lg" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-10 w-25 rounded" />
              <Skeleton className="size-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 md:px-12 lg:px-16 -mt-10 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {SKELETON_ITEMS_4.map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-2/3 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
