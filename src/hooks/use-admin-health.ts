"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi, type HealthData } from "@/lib/api/health";
import { queryKeys } from "@/lib/query-keys";
import { STALE } from "@/lib/stale-times";

export function useAdminHealth() {
  const { data, isLoading: loading, isError, refetch: retry } = useQuery<HealthData>({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
    staleTime: STALE.FAST,
    refetchInterval: 30_000,
  });

  return { data, loading, isError, retry };
}
