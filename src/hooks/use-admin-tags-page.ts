"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";
import { useDebounce } from "@/hooks/use-debounce";
import type { Tag } from "@/types";

export function useAdminTagsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading: loading, isError, refetch: retry } = useQuery({
    queryKey: ["admin-tags", page, debouncedSearch, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.tags.list(params);
    },
    staleTime: STALE.DEFAULT,
  });

  const tags = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 1, [data?.meta?.totalPages]);

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
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    creating, setCreating,
    editingId, setEditingId,
    editingName, setEditingName,
    editingImageUrl, setEditingImageUrl,
    editInputRef,
    deleteTarget, setDeleteTarget,
    deleteDialogOpen, setDeleteDialogOpen,
    tags, total, totalPages, limit,
    loading, isError, retry,
    handleCreate, cancelCreate,
    startEdit, handleSaveEdit, cancelEdit,
    handleDelete,
    createMutation, editMutation, deleteMutation,
  };
}
