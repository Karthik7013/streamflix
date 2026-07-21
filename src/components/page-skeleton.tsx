import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS_4 = Array.from({ length: 4 }, (_, i) => i);
const SKELETON_ITEMS_6 = Array.from({ length: 6 }, (_, i) => i);

export function HeroSkeleton() {
  return (
    <div className="relative h-[40vh] sm:h-[55vh] md:h-[70vh] lg:h-[85vh] min-h-125 w-full overflow-hidden bg-muted">
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12 lg:p-16">
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-4/5 max-w-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-28 rounded" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CarouselSkeleton() {
  return (
    <section className="px-4 md:px-8 lg:px-12 pb-8">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="flex gap-3 overflow-hidden">
        {SKELETON_ITEMS_6.map((i) => (
          <Skeleton key={i} className="w-44 aspect-2/3 rounded-lg shrink-0" />
        ))}
      </div>
    </section>
  );
}

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

export function FormSkeleton() {
  return (
    <div className="px-4 md:px-8 lg:px-12 pb-8 max-w-lg mx-auto space-y-4 pt-12">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
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

export function PlayerSkeleton() {
  return (
    <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
      <Skeleton className="size-16 rounded-full" />
    </div>
  );
}
