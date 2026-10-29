"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { InlineEditableTable } from "@/components/admin/shared/inline-editable-table";
import { ColumnDef } from "@tanstack/react-table";
import type { Person } from "@/types";

export function PeopleTable({
  people,
  loading,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
  editingId,
  editingName,
  onEditingNameChange,
  editingTmdbId,
  onEditingTmdbIdChange,
  editingProfileUrl,
  onEditingProfileUrlChange,
  onSaveEdit,
  onCancelEdit,
  editInputRef,
  disabled,
  isEditing,
}: {
  people: Person[];
  loading: boolean;
  sorting?: any;
  onSortingChange?: any;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  editingId: number | null;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  editingTmdbId: string;
  onEditingTmdbIdChange: (v: string) => void;
  editingProfileUrl: string;
  onEditingProfileUrlChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  isEditing?: boolean;
}) {
  const extraColumns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "knownForDepartment",
        header: "Dept.",
        cell: ({ row }) => <Badge variant="secondary">{row.original.knownForDepartment || "—"}</Badge>,
      },
      {
        id: "movieCount",
        header: "Movies",
        cell: ({ row }) => <Badge variant="secondary">{row.original.movieCount ?? 0}</Badge>,
      },
    ],
    []
  );

  const editFields = useMemo(
    () => [
      {
        key: "name",
        value: editingName,
        onChange: onEditingNameChange,
        ref: editInputRef as React.RefObject<HTMLInputElement>,
      },
      {
        key: "tmdbId",
        value: editingTmdbId,
        onChange: onEditingTmdbIdChange,
        placeholder: "TMDB ID (optional)",
      },
      {
        key: "profileUrl",
        value: editingProfileUrl,
        onChange: onEditingProfileUrlChange,
        placeholder: "Profile URL (optional)",
      },
    ],
    [editingName, onEditingNameChange, editingTmdbId, onEditingTmdbIdChange, editingProfileUrl, onEditingProfileUrlChange, editInputRef]
  );

  return (
    <InlineEditableTable<Person>
      items={people}
      loading={loading}
      sorting={sorting}
      onSortingChange={onSortingChange}
      onEdit={onEdit}
      onDelete={onDelete}
      editingId={editingId}
      editFields={editFields}
      onSaveEdit={onSaveEdit}
      onCancelEdit={onCancelEdit}
      disabled={disabled}
      isEditing={isEditing}
      imageKey="profileUrl"
      imageAlt={(p) => p.name}
      imageHeader="Profile"
      extraColumns={extraColumns}
      emptyMessage="No people found."
    />
  );
}
