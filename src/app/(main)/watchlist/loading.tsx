import { Skeleton } from "@/components/ui/skeleton";
import { PosterGridSkeleton } from "@/components/movie/poster-grid-skeleton";

export default function WatchlistLoading() {
  return (
    <div className="space-y-6 px-4 md:px-8 lg:px-12">
      <Skeleton className="h-8 w-48" />
      <PosterGridSkeleton />
    </div>
  );
}
