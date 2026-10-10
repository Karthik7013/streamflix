"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api/watchlist";
import { STALE } from "@/lib/stale-times";
import type { MovieCardData } from "@/types";
import { queryKeys } from "@/lib/query-keys";

export function useHomeWatchlist() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.homeWatchlist,
    queryFn: async () => {
      const { data } = await watchlistApi.list(new URLSearchParams({ page: "1", limit: "10" }));
      return data;
    },
    staleTime: STALE.FAST,
  });

  const stableData = useMemo(() => (data ?? []) as MovieCardData[], [data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
