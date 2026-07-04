"use client";

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { STALE } from "@/lib/stale-times";
import StatsCards from "./stats-cards";
import RecentSignups from "./recent-signups";
import MostFavorited from "./most-favorited";

interface Signup {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string;
}

interface FavoritedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  favCount: number;
}

export default function AdminDashboard() {
  const { data: statsData, isError: statsError, refetch: statsRefetch } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = await res.json();
      return json.stats as { value: number }[];
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const { data: signupsData, isLoading: signupsLoading } = useQuery({
    queryKey: ["admin-recent-signups"],
    queryFn: async () => {
      const res = await fetch("/api/admin/recent-signups");
      if (!res.ok) throw new Error("Failed to fetch signups");
      const json = await res.json();
      return json.recentSignups as Signup[];
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const { data: favoritedData, isLoading: favoritedLoading } = useQuery({
    queryKey: ["admin-most-favorited"],
    queryFn: async () => {
      const res = await fetch("/api/admin/most-favorited");
      if (!res.ok) throw new Error("Failed to fetch most favorited");
      const json = await res.json();
      return json.mostFavorited as FavoritedMovie[];
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
        <ErrorState message="Failed to load dashboard data." onRetry={statsRefetch} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your site metrics.</p>
      </div>

      <StatsCards stats={statsData ?? [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }]} />

      <div className="grid gap-6 lg:grid-cols-2">
        {signupsLoading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <RecentSignups users={recentSignups} />
        )}
        {favoritedLoading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <MostFavorited movies={favoritedData ?? []} />
        )}
      </div>
    </div>
  );
}
