"use client";

import { memo } from "react";
import { MovieCard } from "@/components/movie/movie-card";
import { PosterGridSkeleton } from "@/components/movie/poster-grid-skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { Search } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { MovieCardData } from "@/types";

export const TagMovieGrid = memo(function TagMovieGrid({
  data,
  loading,
  isError,
  retry,
  hasMore,
  onLoadMore,
}: {
  data: MovieCardData[];
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
          <ErrorState message="Unable to load movies." onRetry={retry} />
        </div>
      ) : showEmpty ? (
        <EmptyState
          icon={<Search className="size-8 text-muted-foreground" />}
          title="No movies in this tag yet."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data.map((m, i) => (
              <MovieCard key={m.id} {...m} priority={i < 4} />
            ))}
          </div>
          {loading && (
            <div className="mt-4">
              <PosterGridSkeleton count={4} />
            </div>
          )}
        </>
      )}

      <div ref={sentinelRef} className="h-4" />
    </>
  );
});