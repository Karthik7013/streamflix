"use client";

import { memo, useRef, useEffect } from "react";
import { SeriesCard } from "@/components/series-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { SeriesResult } from "@/hooks/use-series-search";

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
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: "1000px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (loading && data.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (isError && data.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <ErrorState message="Unable to load series." onRetry={retry} />
      </div>
    );
  }

  if (!loading && !isError && data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <p className="font-medium">No series match your search.</p>
        <p className="text-sm">Try different filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {data.map((s) => (
          <SeriesCard key={s.id} title={s.title} slug={s.slug} thumbnailUrl={s.thumbnailUrl} />
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-${i}`} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
    </>
  );
});


