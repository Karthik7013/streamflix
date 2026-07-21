"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";

interface FeaturedSeries {
  id: number;
  seriesId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

export function useAdminFeaturedSeries() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    onSuccess: () => toast.success("Removed from featured."),
    onError: (err) => {
      logger.error("featured", "Failed to remove featured series", err);
      toast.error("Unable to remove from featured.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }),
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
    onSuccess: () => toast.success("Order updated."),
    onError: (err) => {
      logger.error("featured", "Failed to reorder", err);
      toast.error("Unable to update order.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }),
  });

  const handleRemove = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await removeMutation.mutateAsync(id);
    } catch {
      // error toast handled by mutation onError
    } finally {
      setDeletingId(null);
    }
  }, [removeMutation]);

  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapMutation.mutate({ index, direction });
  }, [swapMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(() => new Set(featured.map((f) => f.seriesId)), [featured]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] });
  }, [queryClient]);

  return {
    featured,
    isLoading,
    addOpen,
    setAddOpen,
    deletingId,
    handleRemove,
    handleSwap,
    alreadyFeaturedIds,
    invalidate,
  };
}
