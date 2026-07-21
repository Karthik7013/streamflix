"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";

export function useAdminDashboard() {
  const { data: response, isLoading: statsLoading, isError: statsError, refetch: statsRefetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats(),
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const { data: signupsData, isLoading: signupsLoading } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const { data } = await adminApi.recentSignups();
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const recentSignups = useMemo(
    () => (signupsData ?? []).map((u) => ({ ...u, createdAt: new Date(u.createdAt) })),
    [signupsData],
  );

  return {
    stats: response?.data ?? [],
    growth: response?.growth ?? [],
    statsLoading,
    statsError,
    statsRefetch,
    recentSignups,
    signupsLoading,
  };
}
