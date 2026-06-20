import { Card, CardContent } from "@/components/ui/card";
import { Film, Tags as TagsIcon, Users, ShieldCheck } from "lucide-react";

const statConfig = [
  { label: "Total Movies", icon: Film, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", border: "border-l-blue-500" },
  { label: "Total Tags", icon: TagsIcon, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", border: "border-l-emerald-500" },
  { label: "Total Users", icon: Users, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", border: "border-l-amber-500" },
  { label: "Total Admins", icon: ShieldCheck, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", border: "border-l-rose-500" },
];

export default function StatsCards({ stats }: { stats: { value: number }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const config = statConfig[i];
        const Icon = config.icon;
        return (
          <Card key={i} className={`border-l-4 ${config.border} overflow-hidden`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${config.color}`}>
                  <Icon className="size-6" />
                </div>
                <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{config.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
