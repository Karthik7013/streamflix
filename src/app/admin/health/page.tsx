"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { CheckCircle, XCircle, MinusCircle, Activity } from "lucide-react";
import { useAdminHealth } from "@/hooks/use-admin-health";

const SKELETON_ITEMS_3 = Array.from({ length: 3 }, (_, i) => i);

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ok") return <CheckCircle className="size-5 text-emerald-500" />;
  if (status === "error") return <XCircle className="size-5 text-rose-500" />;
  return <MinusCircle className="size-5 text-muted-foreground" />;
}

function statusLabel(status: string) {
  if (status === "ok") return "Operational";
  if (status === "error") return "Unreachable";
  if (status === "unconfigured") return "Not Configured";
  return status;
}

const serviceNames: Record<string, string> = {
  db: "PostgreSQL",
  redis: "Redis",
};

export default function HealthPage() {
  const { data, loading, isError, retry } = useAdminHealth();

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
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
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Activity className="size-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Status</p>
                    <p className="text-lg font-semibold capitalize">{data.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Activity className="size-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-lg font-semibold tabular-nums">{formatUptime(data.uptime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Activity className="size-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p className="text-lg font-semibold tabular-nums">{data.responseTimeMs}ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
