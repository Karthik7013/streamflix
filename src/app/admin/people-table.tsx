"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/data-table";
import { ActionButtonsCell } from "@/components/admin/table-cells";
import Image from "next/image";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";

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
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
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
  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        cell: ({ row }) =>
          editingId === row.original.id ? (
            <div className="flex flex-col gap-2">
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
              <div className="flex items-center gap-2">
                <Input
                  value={editingTmdbId}
                  onChange={(e) => onEditingTmdbIdChange(e.target.value)}
                  placeholder="TMDB ID (optional)"
                  className="h-8 max-w-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEdit();
                    if (e.key === "Escape") onCancelEdit();
                  }}
                />
                <Input
                  value={editingProfileUrl}
                  onChange={(e) => onEditingProfileUrlChange(e.target.value)}
                  placeholder="Profile URL (optional)"
                  className="h-8 max-w-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEdit();
                    if (e.key === "Escape") onCancelEdit();
                  }}
                />
              </div>
            </div>
          ) : (
            <span className="font-medium">{row.original.name}</span>
          ),
      },
      {
        id: "image",
        header: "Profile",
        cell: ({ row }) => (
          row.original.profileUrl ? (
            <div className="relative size-10 overflow-hidden rounded-md bg-muted">
              <Image
                src={row.original.profileUrl}
                alt={row.original.name}
                width={40}
                height={40}
                sizes="40px"
                className="object-cover size-full"
              />
            </div>
          ) : (
            <div className="size-10 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">—</div>
          )
        ),
      },
      {
        id: "knownForDepartment",
        header: "Dept.",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.knownForDepartment || "—"}</Badge>
        ),
      },
      {
        id: "movieCount",
        header: "Movies",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.movieCount ?? 0}</Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ActionButtonsCell
            actions={[
              {
                key: "edit",
                icon: <PencilIcon className="size-3.5" />,
                onClick: () => onEdit(row.original),
                disabled,
              },
              {
                key: "delete",
                icon: <Trash2Icon className="size-3.5" />,
                onClick: () => onDelete(row.original),
                danger: true,
              },
            ]}
          />
        ),
      },
    ],
    [
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
      onEdit,
      onDelete,
      disabled,
      isEditing,
    ]
  );

  return (
    <DataTable
      columns={columns}
      data={people}
      loading={loading}
      emptyMessage="No people found."
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}
