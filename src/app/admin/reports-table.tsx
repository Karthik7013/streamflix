"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { CheckIcon, XIcon, Trash2Icon } from "lucide-react";
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

export default function ReportsTable({
  reports,
  loading,
  sorting,
  onSortingChange,
  onToggleStatus,
  onSetDeleteTarget,
}: {
  reports: VideoReport[];
  loading: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onToggleStatus: (r: VideoReport) => void;
  onSetDeleteTarget: (r: VideoReport | null) => void;
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
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onToggleStatus(row.original)}
              title={
                row.original.status === "pending"
                  ? "Mark as resolved"
                  : "Reopen"
              }
            >
              {row.original.status === "pending" ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <XIcon className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onSetDeleteTarget(row.original)}
              title="Delete report"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [onToggleStatus, onSetDeleteTarget]
  );

  return (
    <DataTable
      columns={columns}
      data={reports}
      loading={loading}
      emptyMessage="No reports found."
      sorting={sorting}
      onSortingChange={onSortingChange}
      rowKey="id"
    />
  );
}
