"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/feedback/error-state";
import { AlertTriangle, CheckCircle, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminHealth } from "@/hooks/use-admin-health";
import { skeletonItems } from "@/lib/skeletons";
import { formatUptime, StatusIcon, statusLabel, serviceNames } from "@/app/admin/health/health-utils";
import { FlushCacheCard } from "@/app/admin/health/cache-card";

const SKELETON_ITEMS_3 = skeletonItems(3);

export default function HealthPage() {
  const { data, loading, isError, retry } = useAdminHealth();

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold font-heading tracking-tight">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor your application services.</p>
      </div>

      {isError ? (
        <ErrorState message="Unable to load health data." onRetry={retry} className="py-12" />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {SKELETON_ITEMS_3.map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className={cn("relative overflow-hidden transition-colors", data.status === "ok" ? "hover:border-emerald-500/30" : "hover:border-amber-500/30")}>
              <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent", data.status === "ok" ? "from-emerald-500/15" : "from-amber-500/15")} aria-hidden />
              {data.status === "ok" ? (
                <CheckCircle className="pointer-events-none absolute -right-2 -bottom-3 size-16 opacity-[0.07] select-none" aria-hidden />
              ) : (
                <AlertTriangle className="pointer-events-none absolute -right-2 -bottom-3 size-16 opacity-[0.07] select-none" aria-hidden />
              )}
              <CardContent className="relative p-4 md:p-5">
                <div className="flex items-center gap-2">
                  <div className={cn("rounded-lg p-2", data.status === "ok" ? "bg-emerald-500/10" : "bg-amber-500/10")}>
                    {data.status === "ok" ? (
                      <CheckCircle className="size-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Status</p>
                </div>
                <p className="mt-3 text-2xl font-bold">{data.status === "ok" ? "Operational" : "Degraded"}</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-colors hover:border-blue-500/30">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/15 to-transparent" aria-hidden />
              <Clock className="pointer-events-none absolute -right-2 -bottom-3 size-16 opacity-[0.07] select-none" aria-hidden />
              <CardContent className="relative p-4 md:p-5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Clock className="size-4 text-blue-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums">{formatUptime(data.uptime)}</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-colors hover:border-amber-500/30">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/15 to-transparent" aria-hidden />
              <Gauge className="pointer-events-none absolute -right-2 -bottom-3 size-16 opacity-[0.07] select-none" aria-hidden />
              <CardContent className="relative p-4 md:p-5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <Gauge className="size-4 text-amber-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums">{data.responseTimeMs}ms</p>
              </CardContent>
            </Card>
          </div>
          <FlushCacheCard />
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {Object.entries(data.checks).map(([key, check]) => (
                  <div key={key} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={check.status} />
                      <div>
                        <p className="text-sm font-medium">{serviceNames[key] || key}</p>
                        <p className="text-xs text-muted-foreground">{statusLabel(check.status)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular-nums font-medium">
                        {check.latencyMs !== null ? `${check.latencyMs}ms` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">latency</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}