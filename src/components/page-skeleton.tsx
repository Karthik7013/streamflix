import { Skeleton } from "@/components/ui/skeleton";

export function GridSkeleton({ count = 12 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="px-4 md:px-8 lg:px-12 pb-8">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="px-4 md:px-8 lg:px-12 pb-8 space-y-4">
      {items.map((i) => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="px-4 md:px-8 lg:px-12 pb-8 pt-4 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-3/4 max-w-lg" />
    </div>
  );
}

