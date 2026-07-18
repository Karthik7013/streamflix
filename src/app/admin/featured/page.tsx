"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { optimisticUpdate } from "@/lib/optimistic";
import { logger } from "@/lib/logger";
import { FeaturedList } from "@/app/admin/featured-list";
import { AddFeaturedDialog } from "@/app/admin/add-featured-dialog";

type FeaturedMovie = {
  id: number;
  movieId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
};

export default function FeaturedMoviesPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: featured = [], isLoading } = useQuery<FeaturedMovie[]>({
    queryKey: ["admin-featured"],
    queryFn: async () => {
      const { data } = await adminApi.featured.list();
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const removeFeaturedMutation = useMutation({
    mutationFn: (id: number) => adminApi.featured.delete(id),
    onMutate: async (id) =>
      optimisticUpdate<FeaturedMovie[]>(queryClient, ["admin-featured"], (prev) => (prev ?? []).filter((f) => f.id !== id)),
    onSuccess: () => { toast.success("Removed from featured."); },
    onError: (err, _id, context) => {
      logger.error("featured", "Failed to remove featured movie", err);
      toast.error("Unable to remove from featured.");
      if (context?.previous !== undefined) queryClient.setQueryData(["admin-featured"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured"] }); },
  });

  const swapItemsMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<FeaturedMovie[]>(["admin-featured"]) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      await Promise.all([
        adminApi.featured.update(current[index].id, { displayOrder: current[swapIdx].displayOrder }),
        adminApi.featured.update(current[swapIdx].id, { displayOrder: current[index].displayOrder }),
      ]);
    },
    onMutate: async ({ index, direction }) =>
      optimisticUpdate<FeaturedMovie[]>(queryClient, ["admin-featured"], (prev) => {
        const items = prev ?? [];
        if ((direction === "up" && index === 0) || (direction === "down" && index === items.length - 1)) return items;
        const next = [...items];
        const swapIdx = direction === "up" ? index - 1 : index + 1;
        [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
        return next;
      }),
    onSuccess: () => { toast.success("Order updated."); },
    onError: (err, _vars, context) => {
      logger.error("featured", "Failed to reorder", err);
      toast.error("Unable to update order.");
      if (context?.previous !== undefined) queryClient.setQueryData(["admin-featured"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured"] }); },
  });

  const handleRemove = useCallback((id: number) => removeFeaturedMutation.mutate(id), [removeFeaturedMutation]);
  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapItemsMutation.mutate({ index, direction });
  }, [swapItemsMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(() => new Set(featured.map((f) => f.movieId)), [featured]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Movies</h1>
          <p className="text-muted-foreground mt-1">Manage which movies appear on the home page.</p>
        </div>
        <AddFeaturedDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          searchEndpoint="/api/admin/movies"
          addEndpoint="/api/admin/featured"
          entityIdField="movieId"
          dialogTitle="Add Featured Movie"
          alreadyFeaturedIds={alreadyFeaturedIds}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-featured"] })}
        />
      </div>

      <Card className="overflow-hidden p-0 flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          <FeaturedList featured={featured} isLoading={isLoading} onSwap={handleSwap} onRemove={handleRemove} entityIdField="movieId" />
        </CardContent>
      </Card>
    </div>
  );
}
