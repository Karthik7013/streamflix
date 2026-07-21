"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import type { FeaturedItem } from "@/types";
import { homeApi } from "@/lib/api/home";

export function useFeatured() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data } = await homeApi.featured();
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const stableData = useMemo(() => (data ?? []) as FeaturedItem[], [data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
