"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { homeApi } from "@/lib/api/home";
import type { MovieCardData } from "@/types";

export function useTop10Movies() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["home-top-10"],
    queryFn: async () => {
      const { data } = await homeApi.top10();
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const stableData = useMemo(() => (data ?? []) as MovieCardData[], [data]);

  return {
    data: stableData,
    loading: isLoading,
    isError,
    retry: refetch,
  };
}
