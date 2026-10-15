"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Film, CheckCircle, ListChecks, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const statConfig = {
  totalMovies: { label: "Total Movies", icon: Film, tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400", bar: "bg-blue-500", wash: "from-blue-500/15", hover: "hover:border-blue-500/30" },
  published: { label: "Published", icon: CheckCircle, tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500", wash: "from-emerald-500/15", hover: "hover:border-emerald-500/30" },
  requested: { label: "Requested", icon: ListChecks, tile: "bg-purple-500/10 text-purple-600 dark:text-purple-400", bar: "bg-purple-500", wash: "from-purple-500/15", hover: "hover:border-purple-500/30" },
  reports: { label: "Reports", icon: Flag, tile: "bg-rose-500/10 text-rose-600 dark:text-rose-400", bar: "bg-rose-500", wash: "from-rose-500/15", hover: "hover:border-rose-500/30" },
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

const StatCard = memo(function StatCard({ stat, config }: { stat: StatItem; config: typeof statConfig[keyof typeof statConfig] }) {
  const animated = useCountUp(stat.value);
  const Icon = config.icon;
  return (
    <Card className={cn("relative overflow-hidden transition-colors", config.hover)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent", config.wash)} aria-hidden />
      <Icon className="pointer-events-none absolute -right-2 -bottom-3 size-16 opacity-[0.07] select-none" aria-hidden />
      <CardContent className="relative p-4 md:p-5">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-lg p-2", config.tile)}>
            <Icon className="size-4" />
          </div>
          <p className="text-sm text-muted-foreground">{config.label}</p>
        </div>
        <p className="mt-3 text-3xl font-bold tabular-nums">{animated}</p>
        {stat.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{stat.subtitle}</p>
        )}
        {stat.percent !== undefined && (
          <div className="mt-3 h-1 w-full rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-700", config.bar)}
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
