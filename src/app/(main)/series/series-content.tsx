"use client";

import { useState, useRef, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import SearchBar from "@/app/(main)/explore/search-bar";
import { SeriesCard } from "@/components/series-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { seriesApi } from "@/lib/api/series";
import { tagsApi } from "@/lib/api/tags";

interface SeriesResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

import type { Tag } from "@/types";

export function SeriesContent() {
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: allTags } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list(),
  });

  const tagParam = selectedTags.length > 0 ? selectedTags.join(",") : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["series-list", debouncedQ, tagParam],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: "12" });
      if (debouncedQ) params.set("q", debouncedQ);
      if (tagParam) params.set("tags", tagParam);
      const data = await seriesApi.list(params);
      return data as { series: SeriesResult[]; total: number };
    },
    getNextPageParam: (lastPage, pages) => {
      const totalFetched = pages.reduce((sum, p) => sum + p.series.length, 0);
      return totalFetched < lastPage.total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "1000px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allSeries = data?.pages.flatMap((p) => p.series) ?? [];

  function toggleTag(tagId: number) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4 -mx-4 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Series</h1>
        </div>
        <SearchBar value={q} onChange={setQ} />
      </div>

      {allTags && allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedTags([])}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTags.length === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-center text-muted-foreground py-8">Unable to load series.</p>
      ) : allSeries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <p className="font-medium">No series match your search.</p>
          <p className="text-sm">Try different filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allSeries.map((s) => (
            <SeriesCard key={s.id} title={s.title} slug={s.slug} thumbnailUrl={s.thumbnailUrl} />
          ))}
          {isFetchingNextPage &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-${i}`} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </div>
  );
}
