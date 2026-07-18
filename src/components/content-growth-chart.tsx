"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface GrowthData {
  month: string;
  count: number;
}

function placeholderData(): GrowthData[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((m) => ({ month: m, count: 0 }));
}

export function ContentGrowthChart({ data }: { data: GrowthData[] }) {
  const isEmpty = data.length === 0;
  const chartData = isEmpty ? placeholderData() : data;
  const maxCount = isEmpty ? 10 : Math.max(...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="min-w-0">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="size-5 text-blue-500" />
        Content Growth
      </h2>
      <Card className="overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="inline-block size-3 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">Movies added</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isEmpty ? (
                <span className="text-muted-foreground/60 italic">Add movies to see monthly growth</span>
              ) : (
                <>Total: <span className="font-medium text-foreground">{total}</span></>
              )}
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, maxCount + 2]}
                />
                <Tooltip
                  cursor={{ fill: "none" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length || isEmpty) return null;
                    const { month, count } = payload[0].payload as GrowthData;
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
                        <p className="font-medium text-foreground">{month}</p>
                        <p className="text-muted-foreground">{count} movie{count !== 1 ? "s" : ""} added</p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                  opacity={isEmpty ? 0.15 : 1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
