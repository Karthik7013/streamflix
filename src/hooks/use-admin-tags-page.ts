"use client";

import { useState, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";
import { useAdminTagsList } from "@/hooks/use-admin-tags-list";
import { useTagMutations } from "@/hooks/use-tag-mutations";
import type { Tag } from "@/types";

export function useAdminTagsPage() {
  const list = useAdminTagsList();
  const { createMutation, editMutation, deleteMutation } = useTagMutations();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
