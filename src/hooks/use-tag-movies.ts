"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { api } from "@/lib/api/client";
import type { MovieCardData, PaginationMeta } from "@/types";

export function useTagMovies(slug: string) {
  const result = useInfiniteQuery({
    queryKey: ["tag-movies", slug],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams();
      p.set("page", String(pageParam));
      p.set("limit", "12");
      return api<{ data: MovieCardData[]; meta: PaginationMeta }>(`/api/tags/${slug}/movies?${p}`);
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
