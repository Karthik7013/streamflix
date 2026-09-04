"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { CheckIcon, XIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { DateCell, UserCell, ActionButtonsCell } from "@/components/admin/table-cells";
import { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import type { Report } from "@/types";

export function ReportsTable({
  reports,
  loading,
  sorting,
  onSortingChange,
  onToggleStatus,
  onSetDeleteTarget,
  pendingActionId,
  pendingDeleteId,
}: {
  reports: Report[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onToggleStatus: (r: Report) => void;
  onSetDeleteTarget: (r: Report | null) => void;
  pendingActionId?: number | null;
  pendingDeleteId?: number | null;
}) {
  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        id: "movie",
        header: "Movie",
        accessorKey: "movie.title",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.movie.title}</span>
        ),
      },
      {
        id: "reportedBy",
        header: "Reported By",
        cell: ({ row }) => (
          <UserCell name={row.original.user.name} email={row.original.user.email} />
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground max-w-[250px] truncate block">
            {row.original.description || "\u2014"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge
            className={cn(
              row.original.status === "resolved"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            )}
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
              {
                key: "toggle",
                icon:
                  row.original.id === pendingActionId ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : row.original.status === "pending" ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <XIcon className="size-3.5" />
                  ),
                onClick: () => onToggleStatus(row.original),
                disabled: row.original.id === pendingActionId,
                title:
                  row.original.status === "pending"
                    ? "Mark as resolved"
                    : "Reopen",
              },
              {
                key: "delete",
                icon:
                  row.original.id === pendingDeleteId ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-3.5" />
                  ),
                onClick: () => onSetDeleteTarget(row.original),
                disabled: row.original.id === pendingDeleteId,
                title: "Delete report",
                danger: true,
              },
            ]}
          />
        ),
      },
    ],
    [onToggleStatus, onSetDeleteTarget, pendingActionId, pendingDeleteId]
  );

  return (
    <DataTable
      columns={columns}
      data={reports}
      loading={loading}
      emptyMessage="No reports found."
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
}