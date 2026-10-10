"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";
import { useAdminListBase } from "@/hooks/use-admin-list-base";
import type { Tag } from "@/types";

interface TagWithCount extends Tag {
  movieCount?: number;
}

export function useAdminTagsPage() {
  const queryClient = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const list = useAdminListBase<TagWithCount>({
    baseKey: "admin-tags",
    queryFn: async ({ cursor, page, limit, search, sortBy, sortDir }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set("cursor", String(cursor));
      else params.set("page", String(page));
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.tags.list(params);
    },
    defaultLimit: 50,
    defaultSorting: [],
  });

  const invalidateTags = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
    queryClient.invalidateQueries({ queryKey: ["admin-tags-select"] });
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

  const handleCreate = useCallback(async (name: string, imageUrl?: string) => {
    try {
      await createMutation.mutateAsync({ name, imageUrl });
      setCreating(false);
    } catch (err) { logger.error("admin-tags", "Failed to create tag", err); }
  }, [createMutation]);

  const cancelCreate = useCallback(() => setCreating(false), []);

  const startEdit = useCallback((tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingImageUrl(tag.imageUrl || "");
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    const name = editingName.trim();
    if (!name || editingId === null) return;
    const id = editingId;
    try {
      await editMutation.mutateAsync({ id, name, imageUrl: editingImageUrl || undefined });
      setEditingId(null);
      setEditingName("");
      setEditingImageUrl("");
    } catch (err) { logger.error("admin-tags", "Failed to update tag", err); }
  }, [editingName, editingId, editingImageUrl, editMutation]);

  const cancelEdit = useCallback(() => { setEditingId(null); setEditingName(""); setEditingImageUrl(""); }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
    } catch (err) { logger.error("admin-tags", "Failed to delete tag", err); }
  }, [deleteTarget, deleteMutation]);

  return {
    ...list,
    tags: list.items,
    creating, setCreating,
    editingId, setEditingId,
    editingName, setEditingName,
    editingImageUrl, setEditingImageUrl,
    editInputRef,
    deleteTarget, setDeleteTarget,
    deleteDialogOpen, setDeleteDialogOpen,
    handleCreate, cancelCreate,
    startEdit, handleSaveEdit, cancelEdit,
    handleDelete,
    createMutation, editMutation, deleteMutation,
  };
}
