import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-8">
        <Skeleton className="aspect-video md:aspect-21/9 rounded-xl" />

        <section className="p-4">
          <Skeleton className="h-6 w-44 mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-48 space-y-2">
                <Skeleton className="aspect-2/3 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>

        <section className="p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex gap-4 overflow-x-auto pb-2">
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
