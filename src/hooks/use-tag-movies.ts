"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { api } from "@/lib/api/client";
import type { MovieCardData } from "@/types";
import { queryKeys } from "@/lib/query-keys";

interface TagMoviesPage {
  data: MovieCardData[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useTagMovies(slug: string) {
  const result = useInfiniteQuery({
    queryKey: queryKeys.tagMovies(slug),
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams();
      if (pageParam) p.set("cursor", pageParam);
      p.set("limit", "12");
      const res = await api<TagMoviesPage>(`/api/tags/${slug}/movies?${p}`);
      return res;
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
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
