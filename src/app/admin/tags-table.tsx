"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { ColumnDef, SortingState } from "@tanstack/react-table";

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
  onSaveEdit,
  onCancelEdit,
  editInputRef,
  disabled,
  isEditing,
}: {
  tags: Tag[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  editingId: number | null;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  isEditing?: boolean;
}) {
  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        cell: ({ row }) =>
          editingId === row.original.id ? (
            <div className="flex items-center gap-2">
              <Input
                ref={editInputRef as React.Ref<HTMLInputElement>}
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                className="h-8 max-w-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onSaveEdit}
                disabled={isEditing || !editingName.trim()}
              >
                {isEditing ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onCancelEdit} disabled={isEditing}>
                <XIcon className="size-3.5" />
              </Button>
            </div>
          ) : (
            <span className="font-medium">{row.original.name}</span>
          ),
      },
      {
        id: "movieCount",
        header: "Movie Count",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.movieCount ?? 0}</Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(row.original)}
              disabled={disabled}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [
      editingId,
      editingName,
      onEditingNameChange,
      onSaveEdit,
      onCancelEdit,
      editInputRef,
      onEdit,
      onDelete,
      disabled,
      isEditing,
    ]
  );

  return (
    <DataTable
      columns={columns}
      data={tags}
      loading={loading}
      emptyMessage="No tags found."
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}
