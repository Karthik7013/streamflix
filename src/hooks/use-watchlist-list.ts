"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api/watchlist";
import { STALE } from "@/lib/stale-times";

const LIMIT = 20;

export function useWatchlistList() {
  const result = useInfiniteQuery({
    queryKey: ["watchlist"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
      return watchlistApi.list(params);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: STALE.FAST,
  });

  const movies = useMemo(
    () => result.data?.pages.flatMap((p) => p.data) ?? [],
    [result.data?.pages],
  );

  return {
    movies,
    loading: result.isLoading,
    isError: result.isError,
    retry: result.refetch,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
  };
}
