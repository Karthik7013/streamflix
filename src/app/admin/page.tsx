"use client";

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import type { Signup } from "@/types";
import StatsCards from "@/app/admin/stats-cards";
import RecentSignups from "@/app/admin/recent-signups";

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: statsRefetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await adminApi.stats();
      return data;
    },
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
    [signupsData]
  )

  if (statsError) {
    return (
      <div className="flex items-center justify-center p-12">
        <ErrorState message="Unable to load dashboard data." onRetry={statsRefetch} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your site metrics.</p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <StatsCards stats={statsData ?? [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }]} />
      )}

      <RecentSignups users={recentSignups} loading={signupsLoading} />
    </div>
  );
}
