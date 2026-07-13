import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { moviesApi } from "@/lib/api/movies";
import type { MovieCardData } from "@/types";

export function useMovieSearch(q: string, selectedTags: number[], sortBy: string, sortDir: string) {
  const result = useInfiniteQuery({
    queryKey: ["movies", q, selectedTags, sortBy, sortDir],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams();
      if (q) p.set("q", q);
      if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
      p.set("page", String(pageParam));
      p.set("sortBy", sortBy);
      p.set("sortDir", sortDir);
      return moviesApi.list(p);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const pages = result.data?.pages;
  const stableData = useMemo(
    () => (pages?.flatMap((p) => p.data) ?? []) as MovieCardData[],
    [pages]
  );

  return {
    data: stableData,
    loading: result.isLoading || result.isFetchingNextPage,
    isError: result.isError,
    retry: result.refetch,
    hasMore: result.hasNextPage,
    onLoadMore: result.fetchNextPage,
  };
}
