import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi } from "@/lib/api/favorites";
import type { MovieCardData } from "@/types";

export function useWatchlist() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-watchlist"],
    queryFn: () => favoritesApi.list(new URLSearchParams({ page: "1", limit: "10" })),
    staleTime: 5 * 60 * 1000,
  });

  const stableData = useMemo(() => (data?.data ?? []) as MovieCardData[], [data?.data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
