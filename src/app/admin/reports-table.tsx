"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { CheckIcon, XIcon, Trash2Icon } from "lucide-react";
import { DateCell, UserCell, ActionButtonsCell } from "@/components/admin/table-cells";
import { ColumnDef, SortingState } from "@tanstack/react-table";

interface ReportMovie {
  title: string;
  slug: string;
}

interface ReportUser {
  name: string;
  email: string;
}

interface VideoReport {
  id: number;
  movieId: number;
  userId: string;
  description: string;
  status: "pending" | "resolved";
  createdAt: string;
  updatedAt: string;
  movie: ReportMovie;
  user: ReportUser;
}

export function ReportsTable({
  reports,
  loading,
  sorting,
  onSortingChange,
  onToggleStatus,
  onSetDeleteTarget,
  actionLoading,
}: {
  reports: VideoReport[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onToggleStatus: (r: VideoReport) => void;
  onSetDeleteTarget: (r: VideoReport | null) => void;
  actionLoading?: boolean;
}) {
  const columns = useMemo<ColumnDef<VideoReport>[]>(
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
            variant={
              row.original.status === "pending" ? "default" : "secondary"
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
              {
                key: "toggle",
                icon:
                  row.original.status === "pending" ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <XIcon className="size-3.5" />
                  ),
                onClick: () => onToggleStatus(row.original),
                disabled: actionLoading,
                title:
                  row.original.status === "pending"
                    ? "Mark as resolved"
                    : "Reopen",
              },
              {
                key: "delete",
                icon: <Trash2Icon className="size-3.5" />,
                onClick: () => onSetDeleteTarget(row.original),
                title: "Delete report",
              },
            ]}
          />
        ),
      },
    ],
    [onToggleStatus, onSetDeleteTarget, actionLoading]
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