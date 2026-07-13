"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { optimisticUpdate } from "@/lib/optimistic";
import { FeaturedList } from "@/app/admin/featured-list";
import { AddFeaturedDialog } from "@/app/admin/add-featured-dialog";

type FeaturedSeries = {
  id: number;
  seriesId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
};

export default function FeaturedSeriesPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: featured = [], isLoading } = useQuery<FeaturedSeries[]>({
    queryKey: ["admin-featured-series"],
    queryFn: async () => {
      const { data } = await adminApi.featuredSeries.list();
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminApi.featuredSeries.delete(id),
    onMutate: async (id) =>
      optimisticUpdate<FeaturedSeries[]>(queryClient, ["admin-featured-series"], (prev) => (prev ?? []).filter((f) => f.id !== id)),
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const swapMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      await Promise.all([
        adminApi.featuredSeries.update(current[index].id, { displayOrder: current[swapIdx].displayOrder }),
        adminApi.featuredSeries.update(current[swapIdx].id, { displayOrder: current[index].displayOrder }),
      ]);
    },
    onMutate: async ({ index, direction }) =>
      optimisticUpdate<FeaturedSeries[]>(queryClient, ["admin-featured-series"], (prev) => {
        const items = prev ?? [];
        if ((direction === "up" && index === 0) || (direction === "down" && index === items.length - 1)) return items;
        const next = [...items];
        const swapIdx = direction === "up" ? index - 1 : index + 1;
        [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
        return next;
      }),
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const handleRemove = useCallback((id: number) => removeMutation.mutate(id), [removeMutation]);
  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapMutation.mutate({ index, direction });
  }, [swapMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(() => new Set(featured.map((f) => f.seriesId)), [featured]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Series</h1>
          <p className="text-muted-foreground mt-1">Manage which series appear on the series home page.</p>
        </div>
        <AddFeaturedDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          searchEndpoint="/api/admin/series"
          addEndpoint="/api/admin/featured-series"
          entityIdField="seriesId"
          dialogTitle="Add Featured Series"
          alreadyFeaturedIds={alreadyFeaturedIds}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] })}
        />
      </div>

      <Card className="overflow-hidden p-0 flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          <FeaturedList featured={featured} isLoading={isLoading} onSwap={handleSwap} onRemove={handleRemove} entityIdField="seriesId" />
        </CardContent>
      </Card>
    </div>
  );
}
