"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { formatDuration } from "@/lib/format";
import { ColumnDef, SortingState } from "@tanstack/react-table";

import type { Tag } from "@/types";

interface Movie {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  originalLanguage: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export default function MoviesTable({
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
  onSortingChange?: (sorting: SortingState) => void;
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
          <Link
            href={`/movies/${row.original.slug}`}
            className="flex items-center gap-3 group min-w-0"
          >
            <div className="size-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-muted-foreground/10">
              {row.original.thumbnailUrl ? (
                <Image
                  src={row.original.thumbnailUrl}
                  alt={row.original.title}
                  width={48}
                  height={48}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <SearchIcon className="size-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                {row.original.title}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                {row.original.description}
              </p>
            </div>
          </Link>
        ),
      },
      {
        id: "releaseDate",
        header: "Release",
        accessorKey: "releaseDate",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap font-medium">
            {row.original.releaseDate
              ? new Date(row.original.releaseDate).getFullYear()
              : "—"}
          </span>
        ),
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
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : "—"}
          </span>
        ),
      },
      {
        id: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              row.original.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="bg-primary text-primary-foreground border-none font-normal"
                >
                  {tag.name}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(row.original)}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50"
              onClick={() => onDelete(row.original)}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
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
      rowKey="id"
    />
  );
}
