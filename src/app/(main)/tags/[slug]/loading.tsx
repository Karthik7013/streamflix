import { Skeleton } from "@/components/ui/skeleton";
import { PosterGridSkeleton } from "@/components/movie/poster-grid-skeleton";

export default function TagLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="aspect-[3/1] sm:aspect-[4/1] rounded-2xl" />
      <div className="p-8">
        <PosterGridSkeleton />
      </div>
    </div>
  );
}
