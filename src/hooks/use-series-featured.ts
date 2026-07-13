import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { seriesApi } from "@/lib/api/series";
import type { HeroCarouselItem } from "@/components/hero-carousel";

export function useSeriesFeatured() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["series-featured"],
    queryFn: async () => {
      const { data } = await seriesApi.featured();
      return data as HeroCarouselItem[];
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
