"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type SortingState } from "@tanstack/react-table";
import { STALE } from "@/lib/stale-times";
import { adminApi } from "@/lib/api/admin";
import { logger } from "@/lib/logger";
import type { Tag } from "@/types";

export function useAdminTagsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const limit = 50;
  const sortBy = sorting[0]?.id;
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tags", page, search, sortBy, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortDir) params.set("sortDir", sortDir);
      return adminApi.tags.list(params);
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const tags = useMemo(() => data?.data ?? [], [data?.data]);
  const total = useMemo(() => data?.meta?.total ?? 0, [data?.meta?.total]);
  const totalPages = useMemo(() => data?.meta?.totalPages ?? 1, [data?.meta?.totalPages]);

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.tags.create(name),
    onSuccess: () => toast.success("Tag created."),
    onError: (err) => { logger.error("tags", "Failed to create tag", err); toast.error("Unable to create tag."); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-tags"] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => adminApi.tags.update(id, name),
    onSuccess: () => toast.success("Tag updated."),
    onError: (err) => { logger.error("tags", "Failed to update tag", err); toast.error("Unable to update tag."); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-tags"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.tags.delete(id),
    onSuccess: () => toast.success("Tag deleted."),
    onError: (err) => { logger.error("tags", "Failed to delete tag", err); toast.error("Unable to delete tag."); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-tags"] }),
  });

  useEffect(() => { queueMicrotask(() => setPage(1)); }, [search]);

  const handleCreate = useCallback(async (name: string) => {
    try {
      await createMutation.mutateAsync(name);
      setCreating(false);
    } catch { /* error toast handled by mutation onError */ }
  }, [createMutation]);

  const cancelCreate = useCallback(() => setCreating(false), []);

  const startEdit = useCallback((tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    const name = editingName.trim();
    if (!name || editingId === null) return;
    const id = editingId;
    try {
      await editMutation.mutateAsync({ id, name });
      setEditingId(null);
      setEditingName("");
    } catch { /* error toast handled by mutation onError */ }
  }, [editingName, editingId, editMutation]);

  const cancelEdit = useCallback(() => { setEditingId(null); setEditingName(""); }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
    } catch { /* error toast handled by mutation onError; dialog stays open for retry */ }
  }, [deleteTarget, deleteMutation]);

  return {
    page, setPage,
    search, setSearch,
    sorting, setSorting,
    creating, setCreating,
    editingId, setEditingId,
    editingName, setEditingName,
    editInputRef,
    deleteTarget, setDeleteTarget,
    deleteDialogOpen, setDeleteDialogOpen,
    tags, total, totalPages, limit,
    isLoading,
    handleCreate, cancelCreate,
    startEdit, handleSaveEdit, cancelEdit,
    handleDelete,
    createMutation, editMutation, deleteMutation,
  };
}
