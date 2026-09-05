"use client";

import { useMemo } from "react";
import { SearchIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { formatDuration } from "@/lib/format";
import {
  DateCell,
  YearCell,
  PublishedStatusCell,
  TagsCell,
  MediaTitleCell,
  ActionButtonsCell,
} from "@/components/admin/table-cells";
import { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";

import type { Movie } from "@/types";

export function MoviesTable({
  movies,
  loading,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
}: {
  movies: Movie[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onEdit: (m: Movie) => void;
  onDelete: (m: Movie) => void;
}) {
  const columns = useMemo<ColumnDef<Movie>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        accessorKey: "title",
        enableSorting: true,
        cell: ({ row }) => (
          <MediaTitleCell
            href={`/movies/${row.original.slug}`}
            title={row.original.title}
            description={row.original.description}
            thumbnail={row.original.thumbnailUrl}
            icon={<SearchIcon className="size-4" />}
          />
        ),
      },
      {
        id: "published",
        header: "Status",
        accessorKey: "published",
        enableSorting: true,
        cell: ({ row }) => <PublishedStatusCell published={row.original.published} />,
      },
      {
        id: "releaseDate",
        header: "Release",
        accessorKey: "releaseDate",
        enableSorting: true,
        cell: ({ row }) => <YearCell date={row.original.releaseDate} />,
      },
      {
        id: "durationSeconds",
        header: "Duration",
        accessorKey: "durationSeconds",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {row.original.durationSeconds
              ? formatDuration(row.original.durationSeconds)
              : "—"}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Created",
        accessorKey: "createdAt",
        enableSorting: true,
        cell: ({ row }) => <DateCell date={row.original.createdAt} />,
      },
      {
        id: "tags",
        header: "Tags",
        cell: ({ row }) => <TagsCell tags={row.original.tags} />,
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
    [onEdit, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      data={movies}
      loading={loading}
      emptyMessage="No movies found matching your criteria."
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}