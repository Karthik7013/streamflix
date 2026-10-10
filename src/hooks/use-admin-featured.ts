"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/query-keys";

export interface AdminFeaturedItem {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  movieId: number;
}

export function useAdminFeaturedMovies() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: featured = [], isLoading: loading, isError, refetch } = useQuery<AdminFeaturedItem[]>({
    queryKey: [...queryKeys.adminFeatured],
    queryFn: async () => {
      const { data } = await adminApi.featured.list();
      return data;
    },
    staleTime: STALE.DEFAULT,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminFeatured });
  }, [queryClient]);

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminApi.featured.delete(id),
    onSuccess: () => toast.success("Removed from featured."),
    onError: (err) => {
      logger.error("featured", "Failed to remove featured movie", err);
      toast.error("Unable to remove from featured.");
    },
    onSettled: invalidate,
  });

  const swapMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<AdminFeaturedItem[]>(queryKeys.adminFeatured) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      const a = current[index];
      const b = current[swapIdx];
      if (!a || !b) {
        throw new Error("Featured item out of bounds for reorder");
      }
      await Promise.all([
        adminApi.featured.update(a.id, { displayOrder: b.displayOrder }),
        adminApi.featured.update(b.id, { displayOrder: a.displayOrder }),
      ]);
    },
    onSuccess: () => toast.success("Order updated."),
    onError: (err) => {
      logger.error("featured", "Failed to reorder", err);
      toast.error("Unable to update order.");
    },
    onSettled: invalidate,
  });

  const handleRemove = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await removeMutation.mutateAsync(id);
    } catch (err) {
      logger.error("featured", "Failed to remove featured movie", err);
    } finally {
      setDeletingId(null);
    }
  }, [removeMutation]);

  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapMutation.mutate({ index, direction });
  }, [swapMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(
    () => featured.map((f) => f.movieId),
    [featured],
  );

  return {
    featured,
    loading,
    isError,
    retry: refetch,
    addOpen,
    setAddOpen,
    deletingId,
    handleRemove,
    handleSwap,
    alreadyFeaturedIds,
    invalidate,
    isSwapping: swapMutation.isPending,
  };
}
