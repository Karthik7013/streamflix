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
}

export interface UseAdminFeaturedReturn<T extends AdminFeaturedItem = AdminFeaturedItem> {
  featured: T[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
  addOpen: boolean;
  setAddOpen: (open: boolean) => void;
  deletingId: number | null;
  handleRemove: (id: number) => void;
  handleSwap: (index: number, direction: "up" | "down") => void;
  alreadyFeaturedIds: number[];
  invalidate: () => void;
  isSwapping: boolean;
}

interface UseAdminFeaturedOptions<T extends AdminFeaturedItem> {
  queryKey: string[];
  label: string;
  list: () => Promise<{ data: T[] }>;
  update: (id: number, body: { displayOrder: number }) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  entityIdField: keyof T;
}

export function useAdminFeatured<T extends AdminFeaturedItem>({
  queryKey,
  label,
  list,
  update,
  remove,
  entityIdField,
}: UseAdminFeaturedOptions<T>): UseAdminFeaturedReturn<T> {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: featured = [], isLoading: loading, isError, refetch } = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await list();
      return data;
    },
    staleTime: STALE.DEFAULT,
  });

  const removeMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => toast.success("Removed from featured."),
    onError: (err) => {
      logger.error("featured", `Failed to remove featured ${label}`, err);
      toast.error("Unable to remove from featured.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const swapMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<T[]>(queryKey) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      const a = current[index];
      const b = current[swapIdx];
      if (!a || !b) {
        throw new Error("Featured item out of bounds for reorder");
      }
      await Promise.all([
        update(a.id, { displayOrder: b.displayOrder }),
        update(b.id, { displayOrder: a.displayOrder }),
      ]);
    },
    onSuccess: () => toast.success("Order updated."),
    onError: (err) => {
      logger.error("featured", "Failed to reorder", err);
      toast.error("Unable to update order.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const handleRemove = useCallback(async (id: number) => {
    setDeletingId(id);
    try {
      await removeMutation.mutateAsync(id);
    } catch (err) {
      logger.error("featured", `Failed to remove featured ${label}`, err);
    } finally {
      setDeletingId(null);
    }
  }, [removeMutation, label]);

  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapMutation.mutate({ index, direction });
  }, [swapMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(
    () => featured.map((f) => f[entityIdField] as number),
    [featured, entityIdField],
  );

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

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

export const useAdminFeaturedMovies = () =>
  useAdminFeatured({
    queryKey: [...queryKeys.adminFeatured],
    label: "movie",
    list: () => adminApi.featured.list(),
    update: (id, body) => adminApi.featured.update(id, body),
    remove: (id) => adminApi.featured.delete(id),
    entityIdField: "movieId",
  });


