"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { STALE } from "@/lib/stale-times";
import { shortsApi } from "@/lib/api/shorts";

const LIMIT = 10;

export function useShorts() {
  const result = useInfiniteQuery({
    queryKey: ["shorts"],
    queryFn: ({ pageParam }) => shortsApi.list({ cursor: pageParam, limit: LIMIT }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as number | undefined,
    staleTime: STALE.DEFAULT,
  });

  const items = useMemo(() => result.data?.pages.flatMap((p) => p.data) ?? [], [result.data]);

  return {
    items,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
    loading: result.isLoading,
    isError: result.isError,
    retry: result.refetch,
  };
}
