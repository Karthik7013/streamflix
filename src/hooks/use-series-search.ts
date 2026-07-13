import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { seriesApi } from "@/lib/api/series";

export interface SeriesResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export function useSeriesSearch(q: string, tagParam: string | undefined) {
  const result = useInfiniteQuery({
    queryKey: ["series-list", q, tagParam],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: "12" });
      if (q) params.set("q", q);
      if (tagParam) params.set("tags", tagParam);
      return seriesApi.list(params);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
  });

  const pages = result.data?.pages;
  const stableData = useMemo(
    () => (pages?.flatMap((p) => p.data) ?? []) as SeriesResult[],
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
