"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { CheckIcon, PlusIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react";
import { DateCell, UserCell, ActionButtonsCell } from "@/components/admin/table-cells";
import { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import type { MovieRequest } from "@/types";

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
  onSortingChange?: OnChangeFn<SortingState>;
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
          <UserCell name={row.original.user.name} email={row.original.user.email} />
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
        cell: ({ row }) => <DateCell date={row.original.createdAt} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ActionButtonsCell
            actions={[
              ...(row.original.status === "pending"
                ? [
                    {
                      key: "fulfill",
                      icon: <CheckIcon className="size-3.5" />,
                      onClick: () => onFulfill(row.original),
                      disabled: actionLoading,
                      title: "Mark as fulfilled",
                    } as const,
                    {
                      key: "create",
                      icon: <PlusIcon className="size-3.5" />,
                      onClick: () => onOpenCreateMovie(row.original),
                      title: "Create movie from request",
                    } as const,
                  ]
                : []),
              {
                key: "delete",
                icon: <Trash2Icon className="size-3.5" />,
                onClick: () => onSetDeleteTarget(row.original),
                title: "Delete request",
                danger: true,
              },
            ]}
          />
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