"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { CheckIcon, PlusIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react";
import { ColumnDef, SortingState } from "@tanstack/react-table";

interface RequestUser {
  name: string;
  email: string;
}

interface MovieRequest {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  status: "pending" | "fulfilled";
  createdAt: string;
  updatedAt: string;
  user: RequestUser;
}

export function RequestsTable({
  requests,
  loading,
  sorting,
  onSortingChange,
  onFulfill,
  onOpenCreateMovie,
  onSetDeleteTarget,
  actionLoading,
}: {
  requests: MovieRequest[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onFulfill: (r: MovieRequest) => void;
  onOpenCreateMovie: (r: MovieRequest) => void;
  onSetDeleteTarget: (r: MovieRequest | null) => void;
  actionLoading?: boolean;
}) {
  const columns = useMemo<ColumnDef<MovieRequest>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        accessorKey: "title",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "requester",
        header: "Requester",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.user.email}
            </div>
          </div>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
            {row.original.description || "\u2014"}
          </span>
        ),
      },
      {
        id: "externalLink",
        header: "Link",
        cell: ({ row }) =>
          row.original.externalLink ? (
            <a
              href={row.original.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
            >
              Link <ExternalLinkIcon className="size-3" />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">{"\u2014"}</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === "fulfilled" ? "default" : "secondary"
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "createdAt",
        header: "Date",
        accessorKey: "createdAt",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {row.original.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onFulfill(row.original)}
                  disabled={actionLoading}
                  title="Mark as fulfilled"
                >
                  <CheckIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onOpenCreateMovie(row.original)}
                  title="Create movie from request"
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onSetDeleteTarget(row.original)}
              title="Delete request"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onFulfill, onOpenCreateMovie, onSetDeleteTarget, actionLoading]
  );

  return (
    <DataTable
      columns={columns}
      data={requests}
      loading={loading}
      emptyMessage="No requests found."
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}
