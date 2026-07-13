import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { favoritesApi } from "@/lib/api/favorites";

const LIMIT = 20;

export function useFavoritesList() {
  const result = useInfiniteQuery({
    queryKey: ["favorites"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: String(LIMIT) });
      return favoritesApi.list(params);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
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
