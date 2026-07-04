"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon } from "lucide-react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

import type { Tag } from "@/types";

export default function TagsTable({
  tags,
  loading,
  sorting,
  onSortingChange,
  onEdit,
  editingId,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit,
  editInputRef,
  deleteTarget,
  onDeleteTargetChange,
  onDelete,
  disabled,
}: {
  tags: Tag[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (tag: Tag) => void;
  editingId: number | null;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editInputRef: React.RefObject<HTMLInputElement | null>;
  deleteTarget: Tag | null;
  onDeleteTargetChange: (tag: Tag | null) => void;
  onDelete: () => void;
  disabled: boolean;
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
                disabled={!editingName.trim()}
              >
                <CheckIcon className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onCancelEdit}>
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
            <AlertDialog>
              <AlertDialogTrigger
                onClick={() => onDeleteTargetChange(row.original)}
              >
                <Trash2Icon className="size-3.5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <strong>{deleteTarget?.name}</strong>? This action cannot be
                  undone.
                </AlertDialogDescription>
                <div className="flex justify-end gap-2 mt-6">
                  <AlertDialogClose
                    render={<Button variant="outline">Cancel</Button>}
                    onClick={() => onDeleteTargetChange(null)}
                  />
                  <Button variant="destructive" onClick={onDelete}>
                    Delete
                  </Button>
                </div>
              </AlertDialogContent>
            </AlertDialog>
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
      deleteTarget,
      onDeleteTargetChange,
      onDelete,
      disabled,
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
      rowKey="id"
    />
  );
}
