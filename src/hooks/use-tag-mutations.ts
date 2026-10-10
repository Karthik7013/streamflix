"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/query-keys";

export function useTagMutations() {
  const queryClient = useQueryClient();

  const invalidateTags = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminTags });
    queryClient.invalidateQueries({ queryKey: queryKeys.adminTagsSelect });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: ({ name, imageUrl }: { name: string; imageUrl?: string }) => adminApi.tags.create(name, imageUrl),
    onSuccess: () => toast.success("Tag created."),
    onError: (err) => { logger.error("tags", "Failed to create tag", err); toast.error("Unable to create tag."); },
    onSettled: invalidateTags,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, name, imageUrl }: { id: number; name: string; imageUrl?: string }) => adminApi.tags.update(id, name, imageUrl),
    onSuccess: () => toast.success("Tag updated."),
    onError: (err) => { logger.error("tags", "Failed to update tag", err); toast.error("Unable to update tag."); },
    onSettled: invalidateTags,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.tags.delete(id),
    onSuccess: () => toast.success("Tag deleted."),
    onError: (err) => { logger.error("tags", "Failed to delete tag", err); toast.error("Unable to delete tag."); },
    onSettled: invalidateTags,
  });

  return { createMutation, editMutation, deleteMutation, invalidateTags };
}
