"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api/watchlist";
import { STALE } from "@/lib/stale-times";
import type { MovieCardData } from "@/types";

export function useHomeWatchlist() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-watchlist"],
    queryFn: () => watchlistApi.list(new URLSearchParams({ page: "1", limit: "10" })),
    staleTime: STALE.FAST,
  });

  const stableData = useMemo(() => (data?.data ?? []) as MovieCardData[], [data?.data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
