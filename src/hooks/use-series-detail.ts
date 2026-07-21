"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { seriesApi } from "@/lib/api/series";
import type { SeriesDetail } from "@/types";

export function useSeriesDetail(slug: string) {
  const result = useQuery<SeriesDetail>({
    queryKey: ["series", slug],
    queryFn: async () => {
      const { data } = await seriesApi.getBySlug(slug);
      return data as SeriesDetail;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  return {
    data: result.data,
    loading: result.isLoading,
    error: result.error,
    retry: result.refetch,
  };
}
