"use client";

import { ErrorState } from "@/components/error-state";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { StatsCards } from "@/app/admin/stats-cards";
import { RecentSignups } from "@/app/admin/recent-signups";
import { ContentGrowthChart } from "@/components/content-growth-chart";

const SKELETON_ITEMS_4 = Array.from({ length: 4 }, (_, i) => i);

export default function AdminDashboard() {
  const { stats, growth, statsLoading, statsError, statsRefetch, recentSignups, signupsLoading } =
    useAdminDashboard();

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
          {SKELETON_ITEMS_4.map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      <ContentGrowthChart data={growth} />

      <RecentSignups users={recentSignups} loading={signupsLoading} />
    </div>
  );
}
