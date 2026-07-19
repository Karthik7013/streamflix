"use client";

import { memo, useRef, useEffect } from "react";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { MovieCardData as Movie } from "@/types";

const SKELETON_ITEMS_4 = Array.from({ length: 4 }, (_, i) => i);

function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    const style = getComputedStyle(el);
    if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

export const MovieGrid = memo(function MovieGrid({
  data,
  loading,
  isError,
  retry,
  hasMore,
  onLoadMore,
}: {
  data: Movie[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const scrollContainer = findScrollContainer(
      document.querySelector("main")
    );
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { root: scrollContainer, rootMargin: "0px 0px 1000px 0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const showError = !loading && isError && data.length === 0;
  const showEmpty = !loading && !isError && data.length === 0;

  return (
    <>
      {showError ? (
        <p className="text-muted-foreground text-center py-12">
          Unable to load titles. Please try again.
        </p>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No titles match your search.</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.map((m) => (
            <MovieCard key={m.id} {...m} />
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


