"use client";

import { useState, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";
import { useAdminPeopleList } from "@/hooks/people/admin-list";
import { usePersonMutations } from "@/hooks/people/mutations";
import type { Person } from "@/types";

export function useAdminPeoplePage() {
  const list = useAdminPeopleList();
  const { createMutation, editMutation, deleteMutation } = usePersonMutations();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingTmdbId, setEditingTmdbId] = useState("");
  const [editingProfileUrl, setEditingProfileUrl] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCreate = useCallback(async (name: string, tmdbId?: number, profileUrl?: string) => {
    try {
      await createMutation.mutateAsync({ name, tmdbId: tmdbId ?? null, profileUrl: profileUrl || null });
      setCreating(false);
    } catch (err) { logger.error("admin-people", "Failed to create person", err); }
  }, [createMutation]);

  const cancelCreate = useCallback(() => setCreating(false), []);

  const startEdit = useCallback((person: Person) => {
    setEditingId(person.id);
    setEditingName(person.name);
    setEditingTmdbId(String(person.tmdbId ?? ""));
    setEditingProfileUrl(person.profileUrl || "");
    setTimeout(() => editInputRef.current?.focus(), 0);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    const name = editingName.trim();
    if (!name || editingId === null) return;
    const id = editingId;
    try {
      await editMutation.mutateAsync({
        id,
        body: {
          name,
          tmdbId: editingTmdbId ? parseInt(editingTmdbId, 10) || undefined : null,
          profileUrl: editingProfileUrl || undefined,
        },
      });
      setEditingId(null);
      setEditingName("");
      setEditingTmdbId("");
      setEditingProfileUrl("");
    } catch (err) { logger.error("admin-people", "Failed to update person", err); }
  }, [editingName, editingId, editingTmdbId, editingProfileUrl, editMutation]);

  const cancelEdit = useCallback(() => { setEditingId(null); setEditingName(""); setEditingTmdbId(""); setEditingProfileUrl(""); }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
    } catch (err) { logger.error("admin-people", "Failed to delete person", err); }
  }, [deleteTarget, deleteMutation]);

  return {
    ...list,
    creating, setCreating,
    editingId, setEditingId,
    editingName, setEditingName,
    editingTmdbId, setEditingTmdbId,
    editingProfileUrl, setEditingProfileUrl,
    editInputRef,
    deleteTarget, setDeleteTarget,
    deleteDialogOpen, setDeleteDialogOpen,
    handleCreate, cancelCreate,
    startEdit, handleSaveEdit, cancelEdit,
    handleDelete,
    createMutation, editMutation, deleteMutation,
  };
}
