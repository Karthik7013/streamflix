"use client";

import { useMemo, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/admin/data-table";
import { ActionButtonsCell, type TableAction } from "@/components/admin/table-cells";
import Image from "next/image";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";

interface InlineEditField {
  key: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ref?: RefObject<HTMLInputElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

interface InlineEditableTableProps<T extends { id: number; name: string; [k: string]: any }> {
  items: T[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  editingId: number | null;
  editFields: InlineEditField[];
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  editInputRef?: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  isEditing?: boolean;
  imageKey?: string;
  imageAlt?: (item: T) => string;
  extraColumns?: ColumnDef<T>[];
  emptyMessage?: string;
  nameHeader?: string;
  imageHeader?: string;
}

export function InlineEditableTable<T extends { id: number; name: string; [k: string]: any }>({
  items,
  loading,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
  editingId,
  editFields,
  onSaveEdit,
  onCancelEdit,
  disabled = false,
  isEditing = false,
  imageKey,
  imageAlt,
  extraColumns = [],
  emptyMessage = "No items found.",
  nameHeader = "Name",
  imageHeader = "Image",
}: InlineEditableTableProps<T>) {
  const columns = useMemo<ColumnDef<T>[]>(
    () => [
      {
        id: "name",
        header: nameHeader,
        accessorKey: "name",
        enableSorting: true,
        cell: ({ row }) => {
          if (editingId === row.original.id) {
            return (
              <div className="flex flex-col gap-2">
                {editFields.map((field, idx) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Input
                      ref={field.ref ?? (idx === 0 ? undefined : undefined)}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-8 max-w-xs"
                      placeholder={field.placeholder}
                      onKeyDown={
                        field.onKeyDown ?? ((e) => {
                          if (e.key === "Enter") onSaveEdit();
                          if (e.key === "Escape") onCancelEdit();
                        })
                      }
                    />
                    {idx === 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={onSaveEdit}
                          disabled={isEditing}
                        >
                          {isEditing ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={onCancelEdit} disabled={isEditing}>
                          <XIcon className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          }
          return <span className="font-medium">{row.original.name}</span>;
        },
      },
      ...(imageKey
        ? [
            {
              id: "image",
              header: imageHeader,
              cell: ({ row }: any) => {
                const url = row.original[imageKey];
                if (!url) {
                  return <div className="size-10 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">—</div>;
                }
                return (
                  <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={url}
                      alt={imageAlt ? imageAlt(row.original) : row.original.name}
                      width={40}
                      height={40}
                      sizes="40px"
                      className="object-cover size-full"
                    />
                  </div>
                );
              },
            } as ColumnDef<T>,
          ]
        : []),
      ...extraColumns,
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
      nameHeader,
      imageHeader,
      imageKey,
      imageAlt,
      extraColumns,
      editingId,
      editFields,
      onSaveEdit,
      onCancelEdit,
      isEditing,
      onEdit,
      onDelete,
      disabled,
    ]
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      loading={loading}
      emptyMessage={emptyMessage}
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}
