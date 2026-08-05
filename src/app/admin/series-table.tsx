"use client";

import { useMemo } from "react";
import { TvIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { DataTable } from "@/components/data-table";
import {
  YearCell,
  PublishedStatusCell,
  TagsCell,
  MediaTitleCell,
  ActionButtonsCell,
} from "@/components/admin/table-cells";
import { ColumnDef, SortingState } from "@tanstack/react-table";

import type { Tag } from "@/types";

interface SerializedSeries {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null;
  tmdbId: number | null;
  originalLanguage: string | null;
  tags: Tag[];
  seasonCount?: number;
  published: boolean;
}

export function SeriesTable({
  series,
  loading,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
}: {
  series: SerializedSeries[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onEdit: (s: SerializedSeries) => void;
  onDelete: (s: SerializedSeries) => void;
}) {
  const columns = useMemo<ColumnDef<SerializedSeries>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        accessorKey: "title",
        enableSorting: true,
        cell: ({ row }) => (
          <MediaTitleCell
            href={`/admin/series/${row.original.id}`}
            title={row.original.title}
            description={row.original.description}
            thumbnail={row.original.thumbnailUrl}
            icon={<TvIcon className="size-4" />}
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
        id: "seasonCount",
        header: "Seasons",
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap font-medium">
            {row.original.seasonCount ?? 0}
          </span>
        ),
      },
      {
        id: "releaseDate",
        header: "Release",
        accessorKey: "releaseDate",
        enableSorting: true,
        cell: ({ row }) => <YearCell date={row.original.releaseDate} />,
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
      data={series}
      loading={loading}
      emptyMessage="No series found matching your criteria."
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}