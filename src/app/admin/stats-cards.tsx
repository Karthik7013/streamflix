"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Film, CheckCircle, FileEdit, Flag } from "lucide-react";

const statConfig = {
  totalMovies: { label: "Total Movies", icon: Film, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", barColor: "bg-blue-500", border: "border-l-blue-500" },
  published: { label: "Published", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", barColor: "bg-emerald-500", border: "border-l-emerald-500" },
  draft: { label: "Draft", icon: FileEdit, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", barColor: "bg-amber-500", border: "border-l-amber-500" },
  reports: { label: "Reports", icon: Flag, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", barColor: "bg-rose-500", border: "border-l-rose-500" },
};

function useCountUp(target: number, duration = 600) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    prevTarget.current = target;
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

interface StatItem {
  type: string;
  value: number;
  subtitle?: string;
  percent?: number;
}

import { memo } from "react";

const StatCard = memo(function StatCard({ stat, config }: { stat: StatItem; config: typeof statConfig[keyof typeof statConfig] }) {
  const animated = useCountUp(stat.value);
  const Icon = config.icon;
  return (
    <Card className={`border-l-4 ${config.border} overflow-hidden`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-xl p-3 ${config.color}`}>
            <Icon className="size-6" />
          </div>
          <p className="text-3xl font-bold tabular-nums">{animated}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{config.label}</p>
          {stat.subtitle && (
            <p className="text-sm font-medium text-muted-foreground">{stat.subtitle}</p>
          )}
        </div>
        {stat.percent !== undefined && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
              style={{ width: `${stat.percent}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export function StatsCards({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const config = statConfig[stat.type as keyof typeof statConfig]
        if (!config) return null
        return <StatCard key={stat.type} stat={stat} config={config} />
      })}
    </div>
  );
}
