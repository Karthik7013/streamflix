"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import type { FeaturedItem } from "@/types";
import { seriesApi } from "@/lib/api/series";

export function useSeriesFeatured() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["series-featured"],
    queryFn: async () => {
      const { data } = await seriesApi.featured();
      return data as FeaturedItem[];
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
