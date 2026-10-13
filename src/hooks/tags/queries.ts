"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client/admin";
import { tagsApi } from "@/lib/api-client/tags";
import { STALE } from "@/lib/stale-times";
import { queryKeys } from "@/lib/query-keys";
import type { Tag, MovieCardData } from "@/types";

export function useTags() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: async () => {
      const { data } = await tagsApi.list();
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
    refetchOnMount: false,
  });

  const stableData = useMemo(() => data ?? [], [data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}

export function useAdminTags() {
  const { data, isLoading: loading, isError, refetch } = useQuery<Tag[]>({
    queryKey: queryKeys.adminTagsSelect,
    queryFn: async () => {
      const { data } = await adminApi.tags.list(new URLSearchParams({ limit: "100" }));
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
    gcTime: STALE.THIRTY_MIN,
  });

  const allTags = useMemo(() => data ?? [], [data]);

  return { allTags, loading, isError, retry: refetch };
}

export function useTagMovies(slug: string) {
  const result = useInfiniteQuery({
    queryKey: queryKeys.tagMovies(slug),
    queryFn: async ({ pageParam }) =>
      tagsApi.movies(slug, pageParam, 12),
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
