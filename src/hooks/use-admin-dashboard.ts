"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { queryKeys } from "@/lib/query-keys";

export function useAdminDashboard() {
  const { data: response, isLoading: statsLoading, isError: statsError, refetch: statsRetry } = useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: () => adminApi.stats(),
    staleTime: STALE.DEFAULT,
  });

  const { data: signupsData, isLoading: signupsLoading, isError: signupsError, refetch: signupsRetry } = useQuery({
    queryKey: queryKeys.adminRecentSignups,
    queryFn: async () => {
      const { data } = await adminApi.recentSignups();
      return data;
    },
    staleTime: STALE.DEFAULT,
  });

  const recentSignups = useMemo(
    () => (signupsData ?? []).map((u) => ({ ...u, createdAt: new Date(u.createdAt) })),
    [signupsData],
  );

  const stats = useMemo(() => response?.data ?? [], [response?.data]);
  const growth = useMemo(() => response?.growth ?? [], [response?.growth]);

  return {
    stats: { items: stats, growth, loading: statsLoading, error: statsError, retry: statsRetry },
    signups: { users: recentSignups, loading: signupsLoading, error: signupsError, retry: signupsRetry },
  };
}
