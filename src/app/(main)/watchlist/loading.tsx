import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS_8 = Array.from({ length: 8 }, (_, i) => i);

export default function WatchlistLoading() {
  return (
    <div className="space-y-6 px-4 md:px-8 lg:px-12">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {SKELETON_ITEMS_8.map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-2/3 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
