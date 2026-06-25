import { Skeleton } from "@/components/ui/skeleton";

export default function MovieLoading() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 left-4 z-10">
        <Skeleton className="h-8 w-16 rounded" />
      </div>

      <Skeleton className="w-full aspect-video md:aspect-[21/9]" />

      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />

        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <Skeleton className="h-12 w-full rounded-lg" />

        <section className="pt-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-48 space-y-2">
                <Skeleton className="aspect-2/3 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
