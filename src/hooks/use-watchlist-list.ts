"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api/watchlist";
import { STALE } from "@/lib/stale-times";
import { queryKeys } from "@/lib/query-keys";

const LIMIT = 20;

export function useWatchlistList() {
  const result = useInfiniteQuery({
    queryKey: queryKeys.watchlist,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(LIMIT) });
      if (pageParam) params.set("cursor", pageParam);
      return watchlistApi.list(params);
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
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
