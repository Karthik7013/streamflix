"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { seriesApi } from "@/lib/api/series";
import type { SeriesCardItem } from "@/services/series-recent";

export function useSeriesTop10() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["series-top-10"],
    queryFn: async () => {
      const { data } = await seriesApi.top10();
      return data as SeriesCardItem[];
    },
    staleTime: STALE.DEFAULT,
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
