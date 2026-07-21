"use client";

import { useQuery } from "@tanstack/react-query";
import { healthApi, type HealthData } from "@/lib/api/health";

export function useAdminHealth() {
  const { data, isLoading } = useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: () => healthApi.get(),
    refetchInterval: 30_000,
  });

  return { data, isLoading };
}
