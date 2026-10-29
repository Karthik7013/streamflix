"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { InlineEditableTable } from "@/components/admin/shared/inline-editable-table";
import { ColumnDef } from "@tanstack/react-table";
import type { Tag } from "@/types";

export function TagsTable({
  tags,
  loading,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
  editingId,
  editingName,
  onEditingNameChange,
  editingImageUrl,
  onEditingImageUrlChange,
  onSaveEdit,
  onCancelEdit,
  editInputRef,
  disabled,
  isEditing,
}: {
  tags: Tag[];
  loading: boolean;
  sorting?: any;
  onSortingChange?: any;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  editingId: number | null;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  editingImageUrl: string;
  onEditingImageUrlChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  isEditing?: boolean;
}) {
  const extraColumns = useMemo<ColumnDef<Tag>[]>(
    () => [
      {
        id: "movieCount",
        header: "Movie Count",
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
        key: "imageUrl",
        value: editingImageUrl,
        onChange: onEditingImageUrlChange,
        placeholder: "Image URL (optional)",
      },
    ],
    [editingName, onEditingNameChange, editingImageUrl, onEditingImageUrlChange, editInputRef]
  );

  return (
    <InlineEditableTable<Tag>
      items={tags}
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
      imageKey="imageUrl"
      imageAlt={(t) => t.name}
      extraColumns={extraColumns}
      emptyMessage="No tags found."
    />
  );
}