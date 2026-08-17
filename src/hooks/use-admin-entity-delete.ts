"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const SECONDARY_INVALIDATIONS = ["admin-stats", "admin-recent-signups", "admin-most-favorited"] as const;

export function useAdminEntityDelete({
  listKey,
  context,
  deleteFn,
}: {
  listKey: string;
  context: string;
  deleteFn: (id: number) => Promise<unknown>;
}) {
  const queryClient = useQueryClient();

  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [listKey] });
    for (const key of SECONDARY_INVALIDATIONS) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient, listKey]);

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      toast.success("Deleted successfully.");
      invalidateList();
    },
    onError: (err) => {
      logger.error(context, "Delete failed", err);
      toast.error("Unable to delete.");
    },
  });

  return { deleteMutation, invalidateList };
}
