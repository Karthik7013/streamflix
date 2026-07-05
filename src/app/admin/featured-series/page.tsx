"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { STALE } from "@/lib/stale-times";
import { apiFetch } from "@/lib/api/client";
import FeaturedList from "../featured-list";
import AddFeaturedDialog from "../add-featured-dialog";

type FeaturedSeries = {
  id: number;
  seriesId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

export default function FeaturedSeriesPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: featured = [], isLoading } = useQuery<FeaturedSeries[]>({
    queryKey: ["admin-featured-series"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/featured-series");
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      return data.featured || [];
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/admin/featured-series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      queryClient.setQueryData(["admin-featured-series"], previous.filter((f) => f.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const swapMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      const [res1, res2] = await Promise.all([
        apiFetch(`/api/admin/featured-series/${current[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: current[swapIdx].displayOrder }),
        }),
        apiFetch(`/api/admin/featured-series/${current[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: current[index].displayOrder }),
        }),
      ]);
      if (!res1.ok || !res2.ok) throw new Error();
    },
    onMutate: async ({ index, direction }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      if ((direction === "up" && index === 0) || (direction === "down" && index === previous.length - 1)) return { previous };
      const items = [...previous];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      [items[index], items[swapIdx]] = [items[swapIdx], items[index]];
      queryClient.setQueryData(["admin-featured-series"], items);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
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
