"use client";

import Link from "next/link";
import { memo } from "react";
import { SeriesCard } from "@/components/series-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { Search } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { skeletonItems } from "@/lib/skeletons";
import type { SeriesResult } from "@/hooks/use-series-search";

const SKELETON_ITEMS_4 = skeletonItems(4);

export const SeriesGrid = memo(function SeriesGrid({
  data,
  loading,
  isError,
  retry,
  hasMore,
  onLoadMore,
}: {
  data: SeriesResult[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore });

  const showError = !loading && isError && data.length === 0;
  const showEmpty = !loading && !isError && data.length === 0;

  return (
    <>
      {showError ? (
        <div className="flex justify-center py-12">
          <ErrorState message="Unable to load series." onRetry={retry} />
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold font-heading">No series match your search.</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Try adjusting your filters or{" "}
            <Link href="/requests" className="text-primary hover:underline">
              request it
            </Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.map((s) => (
            <SeriesCard key={s.id} title={s.title} slug={s.slug} thumbnailUrl={s.thumbnailUrl} />
          ))}
          {loading &&
            SKELETON_ITEMS_4.map((i) => (
              <div key={"skel-" + i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </>
  );
});
